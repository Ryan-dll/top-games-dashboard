# Roblox Top Games Dashboard (Vite + React + Supabase)

This is a React port of the original single-file HTML dashboard. Behavior is
the same — three tabs pull live data from the same public Roblox proxy
endpoints, plus a Snapshots tab and a Raw JSON tab — except snapshots now
live in Supabase instead of an in-memory JS array.

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev
```

## Supabase — what this code assumes

`src/lib/snapshotsApi.js` is the only file making calls to your backend.
It assumes a table like this:

```sql
create table snapshots (
  id bigint generated always as identity primary key,
  captured_at timestamptz not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
```

`data` stores the same object shape the old client-side snapshot used:

```json
{
  "Top Concurrent Player Games": [{ "universeId": ..., "name": ..., "playerCount": ..., "approvalRatingPercentage": ..., "upVotes": ..., "downVotes": ..., "genre": ..., "minimumAge": ..., "contentMaturity": ... }],
  "Top Up and Coming Games": [...],
  "Top Trending Games": [...]
}
```

**If your actual table/column names are different, `snapshotsApi.js` is the
only place you need to edit** — every other file just deals with
`{ id, ts, ...data }` objects.

You'll also need RLS policies that allow the anon key to `select`, `insert`,
and `delete` on this table (or narrower policies if you want it locked down —
e.g. only allow `insert` from a service-role Edge Function instead of the
browser, and make the anon key read-only). Since this app posts directly
from the browser with the anon key, anyone with your anon key could write
rows unless RLS restricts it.

## Scheduling: 10am / 8pm America/New_York (via Vercel Cron)

Snapshots are taken server-side now, not by anything running in the
browser. `api/snapshot.js` is a Vercel serverless function that re-fetches
all three Roblox endpoints and inserts one snapshot into Supabase using a
**service-role key** (never exposed to the browser). `vercel.json` has two
cron entries that hit it:

```json
{
  "crons": [
    { "path": "/api/snapshot", "schedule": "0 14 * * *" },
    { "path": "/api/snapshot", "schedule": "0 0 * * *" }
  ]
}
```

This runs whether or not anyone has the dashboard open.

**Set these in your Vercel project's Environment Variables** (Project →
Settings → Environment Variables) — not in a committed `.env`:

- `SUPABASE_URL` — your Supabase project URL (same as `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` — service role key, from Supabase Project
  Settings → API. This bypasses RLS, so it must only ever live server-side.
- `CRON_SECRET` — any random string 16+ chars. Vercel automatically sends
  this as `Authorization: Bearer <value>` when it invokes a cron job, and
  `api/snapshot.js` checks it to reject anyone else hitting the route.

**About the times in `vercel.json`:** Vercel Cron is UTC-only, with no
timezone support. `0 14 * * *` / `0 0 * * *` are 10am/8pm Eastern **during
EDT** (UTC-4), which covers roughly mid-March through early November. During
EST (UTC-5, roughly November–March) Eastern clocks fall back an hour, so
those same UTC times land at 9am/7pm Eastern unless you update the schedule.
Two ways to handle that:

1. **Manual (what's shipped here):** twice a year, around the DST
   transitions, edit `vercel.json` to `0 15 * * *` / `0 1 * * *` for EST, or
   back to `0 14 * * *` / `0 0 * * *` for EDT, and redeploy. It's a one-line
   change, twice a year.
2. **Self-correcting:** run the cron more often (e.g. hourly) and have
   `api/snapshot.js` check the current America/New_York hour itself, only
   actually taking a snapshot when it's 10 or 20. This never needs manual
   updates, but hourly cadence requires the Pro plan ($20/mo) since Hobby
   caps each cron entry at once/day.

The countdown shown in the header ("Next snapshot in...") is now purely
informational — it's computed client-side from `src/lib/schedule.js` for
display only. The actual trigger is whatever's live in `vercel.json`, so
keep them in sync if you change one.

### Local testing

`api/snapshot.js` doesn't run under plain `npm run dev` (Vite doesn't know
about the `api/` folder). To test it locally, use the Vercel CLI:

```bash
npm i -g vercel
vercel link
vercel env pull .env.local   # pulls the server-side vars you set in the dashboard
vercel dev
```

Then hit it manually with the right header:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/snapshot
```


## What changed from the static version

- Snapshots are now fetched from and posted to Supabase (`src/lib/snapshotsApi.js`)
  instead of a local `snapshots` array.
- The old "auto-snapshot every 4 hours while the tab is open" timer was
  replaced with a Vercel Cron job hitting `api/snapshot.js` server-side at
  10am/8pm Eastern (see the Scheduling section above) — this runs
  regardless of whether anyone has the dashboard open.
- The old "auto-download snapshot" checkbox was dropped — it doesn't fit
  well now that snapshots persist in Supabase and can be posted twice a day
  unattended. "Download JSON" per-snapshot still works the same as before.
- Everything else (tables, search/sort, metrics, badges, raw JSON tab,
  styling) is a direct port with the same look and behavior.

## Note on React StrictMode

`npm run dev` runs in `React.StrictMode`, which double-invokes effects in
development only (not in production builds). You may see the initial fetch
fire twice in the console during `npm run dev` — that's expected and won't
happen in `npm run build` / production.
