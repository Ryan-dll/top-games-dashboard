// These three endpoints are the same public proxy workers the original
// static site called directly from the browser. They aren't part of the
// Supabase backend - they're just where the live Roblox game data comes
// from before a snapshot of it gets posted to Supabase.
const ENDPOINTS = {
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
    ageRecommendationDisplayName:
      g.ageRecommendationDisplayName || g.ageRecommendation || '',
    genreL1: g.genreL1 || '',
    minimumAge: g.minimumAge ?? 0,
    contentMaturity: g.contentMaturity || '',
  }));
}

async function fetchEndpoint(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const games = normalizeGames(data);
  if (!games.length) throw new Error('No games in response');
  return { games, raw: data };
}

export const fetchTopGames = () => fetchEndpoint(ENDPOINTS.top);
export const fetchUpcomingGames = () => fetchEndpoint(ENDPOINTS.upcoming);
export const fetchTrendingGames = () => fetchEndpoint(ENDPOINTS.trending);
