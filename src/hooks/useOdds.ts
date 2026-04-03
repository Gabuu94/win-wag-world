import { useState, useEffect, useCallback } from "react";
import { allMatches, type MatchData } from "@/data/matches";

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
  gameState?: {
    home_score?: number;
    away_score?: number;
    period?: string;
    clock?: string;
  } | null;
}

const FALLBACK_NOTICE = "Live odds are temporarily unavailable — showing demo markets.";

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

interface SharpEvent {
  id: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  start_time: string;
  is_live: boolean;
  book_count: number;
  markets: string[];
  game_state?: { home_score?: number; away_score?: number; period?: string; clock?: string } | null;
  odds: {
    home: number | null;
    away: number | null;
    draw: number | null;
  };
}

function normalizeSharpEvents(events: SharpEvent[]): NormalizedMatch[] {
  return events
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .map((ev) => {
      const commence = new Date(ev.start_time);
      const isLive = ev.is_live;
      const timeStr = isLive ? "LIVE" : getTimeUntil(commence);

      return {
        matchId: ev.id,
        league: ev.league?.toUpperCase() || ev.sport,
        sport: ev.sport,
        team1: ev.home_team,
        team2: ev.away_team,
        time: timeStr,
        isLive,
        odds: {
          home: ev.odds?.home || 1.5,
          draw: ev.odds?.draw || 0,
          away: ev.odds?.away || 2.5,
        },
        totalMarkets: ev.markets?.length || ev.book_count || 1,
        commenceTime: ev.start_time,
        gameState: ev.game_state,
      };
    });
}

function matchesSport(match: MatchData, sportKey: string) {
  if (sportKey === "upcoming") return true;
  if (sportKey === "soccer" || sportKey.startsWith("soccer_")) return ["football", "soccer"].includes(match.sport);
  if (sportKey.startsWith("basketball")) return match.sport === "basketball";
  if (sportKey.startsWith("icehockey")) return ["hockey", "icehockey"].includes(match.sport);
  if (sportKey.startsWith("americanfootball")) return match.sport === "americanfootball";
  if (sportKey.startsWith("baseball")) return match.sport === "baseball";
  if (sportKey.startsWith("mma")) return match.sport === "mma";
  if (sportKey.startsWith("boxing")) return ["boxing", "mma"].includes(match.sport);
  if (sportKey.startsWith("tennis")) return match.sport === "tennis";
  if (sportKey.startsWith("cricket")) return match.sport === "cricket";
  if (sportKey.startsWith("golf")) return match.sport === "golf";
  return false;
}

function getFallbackMatches(sportKey: string): NormalizedMatch[] {
  const baseTime = Date.now();
  const filteredMatches = allMatches.filter((match) => matchesSport(match, sportKey));
  const sourceMatches = filteredMatches.length > 0 ? filteredMatches : allMatches;

  return sourceMatches
    .map((match, index) => {
      const commenceTime = match.isLive
        ? new Date(baseTime - (index + 1) * 15 * 60 * 1000).toISOString()
        : new Date(baseTime + (index + 1) * 45 * 60 * 1000).toISOString();

      return {
        matchId: match.matchId,
        league: match.league,
        sport: match.sport,
        team1: match.team1,
        team2: match.team2,
        time: match.isLive ? "LIVE" : getTimeUntil(new Date(commenceTime)),
        isLive: match.isLive,
        odds: match.odds,
        totalMarkets: match.totalMarkets,
        commenceTime,
      };
    })
    .sort((a, b) => new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime());
}

export function useOdds(sportKey: string = "upcoming") {
  const [matches, setMatches] = useState<NormalizedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const applyFallback = useCallback(() => {
    setMatches(getFallbackMatches(sportKey));
    setError(null);
    setNotice(FALLBACK_NOTICE);
    setLastUpdated(new Date());
  }, [sportKey]);

  const fetchOdds = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${baseUrl}/functions/v1/fetch-odds?sport=${sportKey}`, {
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch odds: ${response.status}`);
      }

      const result = await response.json();

      // Handle fallback signal from edge function
      if (result.fallback || result.error) {
        applyFallback();
        return;
      }

      const events: SharpEvent[] = result.data || [];

      if (events.length === 0) {
        applyFallback();
        return;
      }

      setMatches(normalizeSharpEvents(events));
      setLastUpdated(new Date());
    } catch {
      applyFallback();
    } finally {
      setLoading(false);
    }
  }, [applyFallback, sportKey]);

  useEffect(() => {
    void fetchOdds();

    const interval = setInterval(() => {
      void fetchOdds(true);
    }, 30000);

    const timeInterval = setInterval(() => {
      setMatches((prev) =>
        prev.map((m) => ({
          ...m,
          time: m.isLive ? "LIVE" : getTimeUntil(new Date(m.commenceTime)),
        }))
      );
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [fetchOdds]);

  return { matches, loading, error, notice, lastUpdated, refetch: () => fetchOdds(true) };
}
