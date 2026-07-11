import { useCallback, useEffect, useState } from 'react';
import JSZip from 'jszip';
import Header from './components/Header';
import GamePanel from './components/GamePanel';
import SnapshotsPanel from './components/SnapshotsPanel';
import RawJsonPanel from './components/RawJsonPanel';
import { useGameData } from './hooks/useGameData';
import { useSnapshots } from './hooks/useSnapshots';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function snapshotFilename(s) {
  return 'roblox-snapshot-' + s.ts.replace(/[:.]/g, '-') + '.json';
}

export default function App() {
  const [activeTab, setActiveTab] = useState('viewer');

  const {
    topGames,
    upcomingGames,
    trendingGames,
    rawJson,
    status,
    fetchTop,
    fetchUpcoming,
    fetchTrending,
    fetchAll,
  } = useGameData();

  const { snapshots } = useSnapshots();

  useEffect(() => {
    fetchAll().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = useCallback((s) => {
    const a = document.createElement('a');
    a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(s, null, 2));
    a.download = snapshotFilename(s);
    a.click();
  }, []);

  const handleDownloadAll = useCallback(async () => {
    const zip = new JSZip();
    snapshots.forEach((s) => {
      zip.file(snapshotFilename(s), JSON.stringify(s, null, 2));
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'roblox-snapshots-' + new Date().toISOString().replace(/[:.]/g, '-') + '.zip');
  }, [snapshots]);

  const handleDownloadCombined = useCallback(() => {
    const combined = {};
    snapshots.forEach((s) => {
      const { id, ts, ...rest } = s;
      combined[ts] = rest;
    });
    const blob = new Blob([JSON.stringify(combined, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'roblox-snapshots-combined-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  }, [snapshots]);

  return (
    <>
      <Header activeTab={activeTab} onTabChange={setActiveTab} status={status} />

      <div className="main">
        <div className={`panel ${activeTab === 'viewer' ? 'active' : ''}`}>
          <GamePanel games={topGames} snapshotCount={snapshots.length} onRefresh={fetchTop} />
        </div>

        <div className={`panel ${activeTab === 'upcoming' ? 'active' : ''}`}>
          <GamePanel games={upcomingGames} snapshotCount={snapshots.length} onRefresh={fetchUpcoming} />
        </div>

        <div className={`panel ${activeTab === 'trending' ? 'active' : ''}`}>
          <GamePanel games={trendingGames} snapshotCount={snapshots.length} onRefresh={fetchTrending} />
        </div>

        <div className={`panel ${activeTab === 'snapshots' ? 'active' : ''}`}>
          <SnapshotsPanel
            snapshots={snapshots}
            onDownload={handleDownload}
            onDownloadAll={handleDownloadAll}
            onDownloadCombined={handleDownloadCombined}
          />
        </div>

        <div className={`panel ${activeTab === 'raw' ? 'active' : ''}`}>
          <RawJsonPanel rawJson={rawJson} />
        </div>
      </div>
    </>
  );
}
