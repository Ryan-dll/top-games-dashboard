import { useCallback, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import JSZip from 'jszip';
import Header from './components/Header';
import GamePanel from './components/GamePanel';
import SnapshotsPanel from './components/SnapshotsPanel';
import { useGameData } from './hooks/useGameData';
import { useSnapshots } from './hooks/useSnapshots';
import { approvalScore } from './utils/format';
import { selectSnapshotsForCombine } from './lib/combineSnapshots';

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

function mapGamesForSnapshot(list) {
  return list.map((g) => ({
    universeId: g.universeId,
    name: g.name,
    playerCount: g.playerCount,
    approvalRatingPercentage: approvalScore(g),
    upVotes: g.totalUpVotes,
    downVotes: g.totalDownVotes,
  }));
}

export default function App() {
  const {
    topGames,
    upcomingGames,
    trendingGames,
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

  const handleDownloadCombined = useCallback(
    (days, detail) => {
      const list = selectSnapshotsForCombine(snapshots, { days, detail });
      const combined = {};
      list.forEach((s) => {
        const { id, ts, ...rest } = s;
        combined[ts] = rest;
      });
      const blob = new Blob([JSON.stringify(combined, null, 2)], { type: 'application/json' });
      const rangeLabel = days == null ? 'all' : `last-${days}d`;
      const detailLabel = detail === 'succinct' ? 'succinct' : 'verbose';
      downloadBlob(
        blob,
        `roblox-snapshots-combined-${rangeLabel}-${detailLabel}-` +
          new Date().toISOString().replace(/[:.]/g, '-') +
          '.json'
      );
    },
    [snapshots]
  );

  // Builds a snapshot from whatever's already loaded in memory - no network
  // call, so it doesn't touch the Roblox API or Supabase, and won't appear
  // in the snapshots list above (which only reflects the server-side cron).
  const handleTakeLocalSnapshot = useCallback(() => {
    const s = {
      ts: new Date().toISOString(),
      'Top Concurrent Player Games': mapGamesForSnapshot(topGames),
      'Top Up and Coming Games': mapGamesForSnapshot(upcomingGames),
      'Top Trending Games': mapGamesForSnapshot(trendingGames),
    };
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'roblox-snapshot-local-' + s.ts.replace(/[:.]/g, '-') + '.json');
  }, [topGames, upcomingGames, trendingGames]);

  return (
    <>
      <Header status={status} />

      <div className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/TopGames" replace />} />
          <Route path="/TopGames" element={<GamePanel games={topGames} onRefresh={fetchTop} />} />
          <Route
            path="/UpAndComingGames"
            element={<GamePanel games={upcomingGames} onRefresh={fetchUpcoming} />}
          />
          <Route path="/TopTrending" element={<GamePanel games={trendingGames} onRefresh={fetchTrending} />} />
          <Route
            path="/Snapshots"
            element={
              <SnapshotsPanel
                snapshots={snapshots}
                onDownload={handleDownload}
                onDownloadAll={handleDownloadAll}
                onDownloadCombined={handleDownloadCombined}
                onTakeLocalSnapshot={handleTakeLocalSnapshot}
              />
            }
          />
          <Route path="*" element={<Navigate to="/TopGames" replace />} />
        </Routes>
      </div>
    </>
  );
}
