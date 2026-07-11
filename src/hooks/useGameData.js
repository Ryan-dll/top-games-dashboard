import { useCallback, useMemo, useState } from 'react';
import { fetchTopGames, fetchUpcomingGames, fetchTrendingGames } from '../lib/robloxApi';

export function useGameData() {
  const [topGames, setTopGames] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [trendingGames, setTrendingGames] = useState([]);
  const [status, setStatus] = useState({ state: 'connecting', message: 'Connecting...' });

  const wrap = useCallback((fetcher, setter) => {
    return async () => {
      setStatus({ state: 'loading', message: 'Fetching...' });
      try {
        const { games } = await fetcher();
        setter(games);
        setStatus({ state: 'live', message: 'Live - updated ' + new Date().toLocaleTimeString() });
        return games;
      } catch (e) {
        setStatus({ state: 'error', message: 'Error: ' + e.message });
        throw e;
      }
    };
  }, []);

  const fetchTop = useMemo(() => wrap(fetchTopGames, setTopGames), [wrap]);
  const fetchUpcoming = useMemo(() => wrap(fetchUpcomingGames, setUpcomingGames), [wrap]);
  const fetchTrending = useMemo(() => wrap(fetchTrendingGames, setTrendingGames), [wrap]);

  const fetchAll = useCallback(
    () => Promise.all([fetchTop(), fetchUpcoming(), fetchTrending()]),
    [fetchTop, fetchUpcoming, fetchTrending]
  );

  return {
    topGames,
    upcomingGames,
    trendingGames,
    status,
    fetchTop,
    fetchUpcoming,
    fetchTrending,
    fetchAll,
  };
}
