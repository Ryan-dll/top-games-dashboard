import { useEffect, useState } from 'react';
import { getNextRunTime } from '../lib/schedule';

const TABS = [
  { id: 'viewer', label: 'Top Games' },
  { id: 'upcoming', label: 'Up and Coming Games' },
  { id: 'trending', label: 'Top Trending' },
  { id: 'snapshots', label: 'Snapshots' },
  { id: 'raw', label: 'Raw JSON' },
];

function formatCountdown(ms) {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Header({ activeTab, onTabChange, status }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const nextRunAt = getNextRunTime(now);
  const msLeft = nextRunAt.getTime() - now.getTime();
  const countdownText = `Next snapshot in ${formatCountdown(msLeft)}`;

  return (
    <div className="header">
      <div className="header-top">
        <h1>Roblox Top Games</h1>
        <div className="status-pill">
          <div className={`dot ${status.state === 'live' ? 'live' : status.state === 'error' ? 'error' : ''}`} />
          <span>{status.message}</span>
        </div>
        <span className="countdown">{countdownText}</span>
      </div>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
