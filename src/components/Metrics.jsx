import { approvalScore, cleanName } from '../utils/format';

function Metric({ label, value, small }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${small ? 'sm' : ''}`}>{value}</div>
    </div>
  );
}

export default function Metrics({ games, snapshotCount }) {
  const total = games.reduce((s, g) => s + g.playerCount, 0);
  const avg = games.length
    ? Math.round(games.reduce((s, g) => s + approvalScore(g), 0) / games.length)
    : 0;
  const top = games[0];
  const topName = top ? cleanName(top.name) : '-';

  return (
    <div className="metrics">
      <Metric label="Games tracked" value={games.length} />
      <Metric label="Total players" value={`${(total / 1e6).toFixed(2)}M`} />
      <Metric label="Avg approval" value={`${avg}%`} />
      <Metric label="Snapshots saved" value={snapshotCount} />
      <Metric label="Top game" value={topName} small />
    </div>
  );
}
