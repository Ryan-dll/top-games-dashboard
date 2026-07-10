import { useCallback, useEffect, useState } from 'react';
import { listSnapshots } from '../lib/snapshotsApi';

// Snapshots are written server-side by Vercel Cron (api/snapshot.js) using
// the service role key. The browser only ever reads them via the anon key,
// which has a SELECT-only RLS policy.
export function useSnapshots() {
  const [snapshots, setSnapshots] = useState([]);

  const refreshSnapshots = useCallback(async () => {
    const rows = await listSnapshots();
    setSnapshots(rows);
  }, []);

  useEffect(() => {
    refreshSnapshots().catch((e) => console.error('Failed to load snapshots', e));
  }, [refreshSnapshots]);

  return { snapshots };
}
