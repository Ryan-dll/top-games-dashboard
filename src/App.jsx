import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header';
import GamePanel from './components/GamePanel';
import SnapshotsPanel from './components/SnapshotsPanel';
import RawJsonPanel from './components/RawJsonPanel';
import { useGameData } from './hooks/useGameData';
import { useSnapshots } from './hooks/useSnapshots';

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
    a.download = 'roblox-snapshot-' + s.ts.replace(/[:.]/g, '-') + '.json';
    a.click();
  }, []);

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
          <SnapshotsPanel snapshots={snapshots} onDownload={handleDownload} />
        </div>

        <div className={`panel ${activeTab === 'raw' ? 'active' : ''}`}>
          <RawJsonPanel rawJson={rawJson} />
        </div>
      </div>
    </>
  );
}
