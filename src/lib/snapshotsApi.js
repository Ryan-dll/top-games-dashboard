import { supabase } from './supabaseClient';

// Table: "Snapshots"
// Columns:
//   id       – auto-generated primary key
//   snapshot – json column holding the snapshot payload
//
// The anon key (used here, in the browser) has a SELECT-only RLS policy.
// Inserts go through api/snapshot.js server-side using the service role key.

const TABLE = 'Snapshots';

export async function listSnapshots() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, snapshot')
    .order('id', { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    ts: row.snapshot?.ts,
    ...row.snapshot,
  }));
}
