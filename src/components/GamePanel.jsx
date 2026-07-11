import { useMemo, useState } from 'react';
import Metrics from './Metrics';
import { approvalScore } from '../utils/format';

const SORT_OPTIONS = [
  { value: 'playerCount', label: 'Players (desc)' },
  { value: 'score', label: 'Approval %' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'totalUpVotes', label: 'Total upvotes' },
  { value: 'genre', label: 'Genre A-Z' },
];

export default function GamePanel({ games, snapshotCount, onRefresh }) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('playerCount');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = games.filter((g) => g.name.toLowerCase().includes(q)).slice();
    if (sortCol === 'playerCount') list.sort((a, b) => b.playerCount - a.playerCount);
    else if (sortCol === 'score') list.sort((a, b) => approvalScore(b) - approvalScore(a));
    else if (sortCol === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortCol === 'totalUpVotes') list.sort((a, b) => b.totalUpVotes - a.totalUpVotes);
    else if (sortCol === 'genre') list.sort((a, b) => (a.genreL1 || '').localeCompare(b.genreL1 || ''));
    return list;
  }, [games, search, sortCol]);

  const minP = games.length ? Math.min(...games.map((g) => g.playerCount)) : 0;
  const maxP = games.length ? Math.max(...games.map((g) => g.playerCount)) : 0;

  return (
    <div>
      <div className="toolbar">
        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sortCol} onChange={(e) => setSortCol(e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button className="btn primary" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <Metrics games={games} snapshotCount={snapshotCount} />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 42 }}>#</th>
              <th>Game</th>
              <th style={{ width: 210 }}>Players</th>
              <th style={{ width: 90 }}>Approval</th>
              <th style={{ width: 90 }}>Age</th>
              <th style={{ width: 130 }}>Genre</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty">
                  {games.length ? 'No games found.' : 'Fetching data...'}
                </td>
              </tr>
            ) : (
              filtered.map((g, i) => {
                const sc = approvalScore(g);
                const cls = sc >= 85 ? 'score-hi' : sc >= 65 ? 'score-mid' : 'score-lo';
                const ratio = maxP > minP ? (g.playerCount - minP) / (maxP - minP) : 0;
                const hue = ratio * 120;
                const age = (g.ageRecommendationDisplayName || '').replace('Maturity: ', '');
                return (
                  <tr key={g.universeId ?? `${g.name}-${i}`}>
                    <td className="rank">{i + 1}</td>
                    <td title={g.name}>{g.name}</td>
                    <td>
                      <div className="bar-wrap">
                        <div className="bar" style={{ width: 10, backgroundColor: `hsl(${hue}, 100%, 50%)` }} />
                        <span className="pcount">{g.playerCount.toLocaleString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${cls}`}>{sc}%</span>
                    </td>
                    <td>
                      <span className="age-badge">{age}</span>
                    </td>
                    <td title={g.genreL1}>{g.genreL1 || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
