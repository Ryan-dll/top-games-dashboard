import { useEffect, useMemo, useState } from 'react';
import { SNAPSHOTS_PER_DAY, selectSnapshotsForCombine } from '../lib/combineSnapshots';

const DAY_PRESETS = [1, 7, 14, 30];

export default function CombineSnapshotsModal({ snapshots, onConfirm, onClose }) {
  const maxDays = Math.max(1, Math.ceil(snapshots.length / SNAPSHOTS_PER_DAY));
  const [mode, setMode] = useState('days');
  const [days, setDays] = useState(Math.min(7, maxDays));
  const [detail, setDetail] = useState('verbose');

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const selectedDays = mode === 'all' ? null : days;

  // Computed with the same helper used for the actual download, so the
  // preview here can never drift from what gets written to disk.
  const finalList = useMemo(
    () => selectSnapshotsForCombine(snapshots, { days: selectedDays, detail }),
    [snapshots, selectedDays, detail]
  );

  const rangeText = useMemo(() => {
    if (finalList.length === 0) return null;
    const newest = finalList[0];
    const oldest = finalList[finalList.length - 1];
    const fmt = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return oldest.ts === newest.ts ? fmt(newest.ts) : `${fmt(oldest.ts)} – ${fmt(newest.ts)}`;
  }, [finalList]);

  const handleConfirm = () => {
    onConfirm(selectedDays, detail);
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
              <span className="modal-help">days ({SNAPSHOTS_PER_DAY} snapshots/day)</span>
            </div>
          </>
        )}

        <div className="seg-row">
          <button className={`seg-btn ${detail === 'verbose' ? 'active' : ''}`} onClick={() => setDetail('verbose')}>
            Verbose
          </button>
          <button
            className={`seg-btn ${detail === 'succinct' ? 'active' : ''}`}
            onClick={() => setDetail('succinct')}
          >
            Succinct
          </button>
        </div>
        <div className="modal-note">
          {detail === 'verbose'
            ? 'Includes every snapshot in range.'
            : 'Just the ~8pm ET snapshot for each day, so daily trends stay easy to compare.'}
        </div>

        <div className="modal-summary">
          {finalList.length} snapshot{finalList.length === 1 ? '' : 's'}
          {rangeText ? ` · ${rangeText}` : ''}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={handleConfirm} disabled={finalList.length === 0}>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
