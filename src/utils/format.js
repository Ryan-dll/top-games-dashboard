export function approvalScore(game) {
  const total = (game.totalUpVotes || 0) + (game.totalDownVotes || 0);
  return total ? Math.round((game.totalUpVotes / total) * 100) : 0;
}

export function cleanName(name, max = 22) {
  if (!name) return '-';
  const stripped = name.replace(/[^\x20-\x7E]/g, '').trim();
  return (stripped || name).slice(0, max);
}
