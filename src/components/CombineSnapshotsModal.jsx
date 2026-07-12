import { useEffect, useMemo, useState } from 'react';

const DAY_PRESETS = [1, 7, 14, 30];
const SNAPSHOTS_PER_DAY = 2;

export default function CombineSnapshotsModal({ snapshots, onConfirm, onClose }) {
  const maxDays = Math.max(1, Math.ceil(snapshots.length / SNAPSHOTS_PER_DAY));
  const [mode, setMode] = useState('days');
  const [days, setDays] = useState(Math.min(7, maxDays));

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // A "day" is 2 snapshots, but the newest/oldest day in the list can be a
  // lone snapshot (e.g. today's evening run hasn't happened yet, or the
  // very first day tracked only got one), so this is naturally clamped
  // rather than forced to land on exact day boundaries.
  const count = mode === 'all' ? snapshots.length : Math.min(days * SNAPSHOTS_PER_DAY, snapshots.length);

  const rangeText = useMemo(() => {
    if (count === 0) return null;
    const newest = snapshots[0];
    const oldest = snapshots[count - 1];
    const fmt = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return oldest.ts === newest.ts ? fmt(newest.ts) : `${fmt(oldest.ts)} – ${fmt(newest.ts)}`;
  }, [snapshots, count]);

  const handleConfirm = () => {
    onConfirm(mode === 'all' ? null : count);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Download combined JSON</div>

        <div className="seg-row">
          <button className={`seg-btn ${mode === 'days' ? 'active' : ''}`} onClick={() => setMode('days')}>
            Last N days
          </button>
          <button className={`seg-btn ${mode === 'all' ? 'active' : ''}`} onClick={() => setMode('all')}>
            All snapshots
          </button>
        </div>

        {mode === 'days' && (
          <>
            <div className="preset-row">
              {DAY_PRESETS.map((p) => (
                <button
                  key={p}
                  className={`chip ${days === p ? 'active' : ''}`}
                  onClick={() => setDays(p)}
                >
                  {p}d
                </button>
              ))}
            </div>
            <div className="modal-input-row">
              <input
                type="number"
                min={1}
                max={maxDays}
                value={days}
                autoFocus
                onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              />
              <span className="modal-help">days (2 snapshots/day)</span>
            </div>
          </>
        )}

        <div className="modal-summary">
          {count} snapshot{count === 1 ? '' : 's'}
          {rangeText ? ` · ${rangeText}` : ''}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={handleConfirm} disabled={count === 0}>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
