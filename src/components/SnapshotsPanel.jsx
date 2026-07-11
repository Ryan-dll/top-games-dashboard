export default function SnapshotsPanel({ snapshots, onDownload, onDownloadAll, onDownloadCombined }) {
  return (
    <div>
      {snapshots.length === 0 ? (
        <div className="empty">No snapshots yet — they're taken automatically at 10am and 8pm ET.</div>
      ) : (
        <>
          <div className="toolbar">
            <button className="btn primary" onClick={onDownloadAll}>
              Download All (.zip)
            </button>
            <button className="btn primary" onClick={onDownloadCombined}>
              Download Combined JSON
            </button>
          </div>
          <div className="snap-list">
            {snapshots.map((s) => {
              const total =
                (s['Top Concurrent Player Games']?.length || 0) +
                (s['Top Up and Coming Games']?.length || 0) +
                (s['Top Trending Games']?.length || 0);
              return (
                <div className="snap-item" key={s.id}>
                  <div className="snap-time">{new Date(s.ts).toLocaleString()}</div>
                  <div className="snap-count">{total} games across 3 categories</div>
                  <button className="snap-action" onClick={() => onDownload(s)}>
                    Download JSON
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
