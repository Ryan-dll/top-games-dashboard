// Vercel Cron hits this route (see vercel.json) at 10am and 8pm America/New_York.
// It re-fetches the three Roblox endpoints and inserts one snapshot into Supabase
// using a service-role key, so it works whether or not anyone has the dashboard open.
//
// This duplicates a bit of logic from src/lib/robloxApi.js and src/hooks/useSnapshots.js
// on purpose - this file runs in a plain Node serverless function, not through Vite,
// so it can't import client-side modules that reference import.meta.env.

import { createClient } from '@supabase/supabase-js';

const ROBLOX_ENDPOINTS = {
  top: 'https://top-games.1-ryanshore.workers.dev/',
  upcoming: 'https://up-and-coming.1-ryanshore.workers.dev/',
  trending: 'https://top-trending.1-ryanshore.workers.dev/',
};

function normalizeGames(data) {
  const items =
    (data?.games?.items && Array.isArray(data.games.items) && data.games.items) ||
    (data?.games && Array.isArray(data.games) && data.games) ||
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data) && data) ||
    (Array.isArray(data?.data) && data.data) ||
    (Array.isArray(data?.list) && data.list) ||
    [];

  return items.map((g) => ({
    universeId: g.universeId,
    name: g.name || g.title || 'Unknown',
    playerCount: g.playerCount || g.concurrentPlayers || 0,
    totalUpVotes: g.totalUpVotes || g.upVotes || 0,
    totalDownVotes: g.totalDownVotes || g.downVotes || 0,
    ageRecommendationDisplayName: g.ageRecommendationDisplayName || g.ageRecommendation || '',
    genreL1: g.genreL1 || '',
    minimumAge: g.minimumAge ?? 0,
    contentMaturity: g.contentMaturity || '',
  }));
}

async function fetchGames(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const data = await res.json();
  const games = normalizeGames(data);
  if (!games.length) throw new Error(`No games in response from ${url}`);
  return games;
}

function approvalScore(g) {
  const total = (g.totalUpVotes || 0) + (g.totalDownVotes || 0);
  return total ? Math.round((g.totalUpVotes / total) * 100) : 0;
}

function mapGames(list) {
  return list.map((g) => ({
    universeId: g.universeId,
    name: g.name,
    playerCount: g.playerCount,
    approvalRatingPercentage: approvalScore(g),
    upVotes: g.totalUpVotes,
    downVotes: g.totalDownVotes,
    genre: g.genreL1,
    minimumAge: g.minimumAge,
    contentMaturity: g.contentMaturity,
  }));
}

export default async function handler(req, res) {
  // Vercel automatically sends CRON_SECRET as a Bearer token on scheduled
  // invocations - this rejects anyone else who tries to hit the route.
  const authHeader = req.headers.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const [topGames, upcomingGames, trendingGames] = await Promise.all([
      fetchGames(ROBLOX_ENDPOINTS.top),
      fetchGames(ROBLOX_ENDPOINTS.upcoming),
      fetchGames(ROBLOX_ENDPOINTS.trending),
    ]);

    // Service-role key: only ever used server-side, never exposed to the browser.
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const snapshot = {
      ts: new Date().toISOString(),
      'Top Concurrent Player Games': mapGames(topGames),
      'Top Up and Coming Games': mapGames(upcomingGames),
      'Top Trending Games': mapGames(trendingGames),
    };

    const { error } = await supabase.from('Snapshots').insert({ snapshot });
    if (error) throw error;

    res.status(200).json({ ok: true, ts: snapshot.ts });
  } catch (e) {
    console.error('Scheduled snapshot failed', e);
    res.status(500).json({ error: e.message });
  }
}
