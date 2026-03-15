import { useState, useEffect, useCallback } from "react";

export interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: { name: string; price: number }[];
    }[];
  }[];
}

export interface NormalizedMatch {
  matchId: string;
  league: string;
  sport: string;
  team1: string;
  team2: string;
  time: string;
  isLive: boolean;
  odds: { home: number; draw: number; away: number };
  totalMarkets: number;
  commenceTime: string;
}

function getTimeUntil(commence: Date): string {
  const now = new Date();
  const diff = commence.getTime() - now.getTime();
  if (diff <= 0) return "LIVE";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function normalizeEvents(events: OddsEvent[]): NormalizedMatch[] {
  const now = new Date();
  return events
    .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime())
    .map((ev) => {
      const commence = new Date(ev.commence_time);
      const isLive = commence <= now;
      const bookmaker = ev.bookmakers?.[0];
      const h2h = bookmaker?.markets?.find((m) => m.key === "h2h");
      const outcomes = h2h?.outcomes || [];

      const homeOdds = outcomes.find((o) => o.name === ev.home_team)?.price || 1.5;
      const awayOdds = outcomes.find((o) => o.name === ev.away_team)?.price || 2.5;
      const drawOdds = outcomes.find((o) => o.name === "Draw")?.price || 0;

      const timeStr = isLive ? "LIVE" : getTimeUntil(commence);

      return {
        matchId: ev.id,
        league: ev.sport_title,
        sport: ev.sport_key,
        team1: ev.home_team,
        team2: ev.away_team,
        time: timeStr,
        isLive,
        odds: { home: homeOdds, draw: drawOdds, away: awayOdds },
        totalMarkets: ev.bookmakers?.length || 1,
        commenceTime: ev.commence_time,
      };
    });
}

export function useOdds(sportKey: string = "upcoming") {
  const [matches, setMatches] = useState<NormalizedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchOdds = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Map "soccer" to the Odds API key for all soccer
      let apiSport = sportKey;
      if (sportKey === "soccer") apiSport = "upcoming";

      const response = await fetch(
        `${baseUrl}/functions/v1/fetch-odds?sport=${apiSport}`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch odds: ${response.status}`);
      }

      const events: OddsEvent[] = await response.json();
      
      // If filtering by "soccer", filter events to only soccer sports
      let filtered = events;
      if (sportKey === "soccer") {
        filtered = events.filter((e) => e.sport_key.startsWith("soccer"));
      }

      setMatches(normalizeEvents(filtered));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch odds");
    } finally {
      setLoading(false);
    }
  }, [sportKey]);

  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
      await fetchOdds();
    };

    doFetch();
    // Refresh every 30 seconds for faster updates
    const interval = setInterval(() => fetchOdds(true), 30000);

    // Update countdown times every 10 seconds
    const timeInterval = setInterval(() => {
      setMatches((prev) =>
        prev.map((m) => ({
          ...m,
          time: m.isLive ? "LIVE" : getTimeUntil(new Date(m.commenceTime)),
        }))
      );
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [fetchOdds]);

  return { matches, loading, error, lastUpdated, refetch: () => fetchOdds(true) };
}
