import { useState, useEffect } from "react";

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

function normalizeEvents(events: OddsEvent[]): NormalizedMatch[] {
  const now = new Date();
  return events.map((ev) => {
    const commence = new Date(ev.commence_time);
    const isLive = commence <= now;
    const bookmaker = ev.bookmakers?.[0];
    const h2h = bookmaker?.markets?.find((m) => m.key === "h2h");
    const outcomes = h2h?.outcomes || [];

    const homeOdds = outcomes.find((o) => o.name === ev.home_team)?.price || 1.5;
    const awayOdds = outcomes.find((o) => o.name === ev.away_team)?.price || 2.5;
    const drawOdds = outcomes.find((o) => o.name === "Draw")?.price || 3.5;

    const timeStr = isLive
      ? "LIVE"
      : commence.toLocaleDateString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit" });

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

  useEffect(() => {
    let cancelled = false;

    const fetchOdds = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const response = await fetch(
          `${baseUrl}/functions/v1/fetch-odds?sport=${sportKey}`,
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
        if (!cancelled) {
          setMatches(normalizeEvents(events));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch odds");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOdds();
    // Refresh every 60 seconds
    const interval = setInterval(fetchOdds, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sportKey]);

  return { matches, loading, error };
}
