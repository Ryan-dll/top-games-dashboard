import { approvalScore } from '../utils/format';

function Metric({ label, value, small }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${small ? 'sm' : ''}`}>{value}</div>
    </div>
  );
}

function topGenre(games) {
  const counts = {};
  games.forEach((g) => {
    const genre = g.genreL1 || 'Unknown';
    counts[genre] = (counts[genre] || 0) + 1;
  });
  let best = '-';
  let bestCount = 0;
  for (const [genre, count] of Object.entries(counts)) {
    if (count > bestCount) {
      best = genre;
      bestCount = count;
    }
  }
  return best;
}

export default function Metrics({ games }) {
  const total = games.reduce((s, g) => s + g.playerCount, 0);
  const avg = games.length
    ? Math.round(games.reduce((s, g) => s + approvalScore(g), 0) / games.length)
    : 0;

  return (
    <div className="metrics">
      <Metric label="Games tracked" value={games.length} />
      <Metric label="Total players" value={`${(total / 1e6).toFixed(2)}M`} />
      <Metric label="Avg approval" value={`${avg}%`} />
      <Metric label="Top genre" value={topGenre(games)} />
    </div>
  );
}
