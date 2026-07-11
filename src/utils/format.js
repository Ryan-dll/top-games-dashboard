export function approvalScore(game) {
  const total = (game.totalUpVotes || 0) + (game.totalDownVotes || 0);
  return total ? Math.round((game.totalUpVotes / total) * 100) : 0;
}
