import { useState, useMemo } from "react";
import MatchCard from "./MatchCard";
import { useOdds, type NormalizedMatch } from "@/hooks/useOdds";
import { Loader2, RefreshCw, Clock, Flame } from "lucide-react";

interface LiveMatchesFeedProps {
  sportKey?: string;
  searchQuery?: string;
}

type SortMode = "kickoff" | "popular";

// Higher score = more prestigious league (shown first in "Popular" sort)
const PRESTIGE_PATTERNS: { regex: RegExp; score: number }[] = [
  { regex: /world cup|fifa world/i, score: 100 },
  { regex: /champions league|uefa champions/i, score: 95 },
  { regex: /europa league/i, score: 85 },
  { regex: /euro\b|european championship/i, score: 90 },
  { regex: /copa america|copa libertadores/i, score: 80 },
  { regex: /premier league|english premier|^epl$/i, score: 75 },
  { regex: /la liga|laliga|primera división/i, score: 73 },
  { regex: /serie a\b/i, score: 70 },
  { regex: /bundesliga/i, score: 68 },
  { regex: /ligue 1/i, score: 65 },
  { regex: /eredivisie/i, score: 55 },
  { regex: /primeira liga|liga portugal/i, score: 52 },
  { regex: /mls|major league soccer/i, score: 45 },
  { regex: /championship/i, score: 40 },
];

function prestigeScore(league: string): number {
  for (const p of PRESTIGE_PATTERNS) if (p.regex.test(league)) return p.score;
  return 0;
}

const LiveMatchesFeed = ({ sportKey = "upcoming", searchQuery = "" }: LiveMatchesFeedProps) => {
  const { matches: rawMatches, loading, error, notice, lastUpdated, refetch } = useOdds(sportKey);
  const [sortMode, setSortMode] = useState<SortMode>("kickoff");

  const matches = useMemo(() => {
    const filtered = searchQuery.trim()
      ? rawMatches.filter((m) => {
          const q = searchQuery.toLowerCase();
          return m.team1.toLowerCase().includes(q) || m.team2.toLowerCase().includes(q) || m.league.toLowerCase().includes(q);
        })
      : rawMatches;

    const sorter = (a: NormalizedMatch, b: NormalizedMatch) => {
      if (sortMode === "popular") {
        const ds = prestigeScore(b.league) - prestigeScore(a.league);
        if (ds !== 0) return ds;
      }
      return new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime();
    };
    return [...filtered].sort(sorter);
  }, [rawMatches, searchQuery, sortMode]);

  const liveMatches = matches.filter((m) => m.isLive);
  const upcomingMatches = matches.filter((m) => !m.isLive);

  return (
    <main className="flex-1 overflow-y-auto p-4 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="text-xs text-muted-foreground">
          {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString()}`}
          {matches.length > 0 && ` · ${matches.length} events`}
        </div>
        <div className="flex items-center gap-3">
          {/* Sort toggle */}
          <div className="inline-flex items-center bg-muted rounded-md p-0.5 text-xs">
            <button
              onClick={() => setSortMode("kickoff")}
              className={`flex items-center gap-1 px-2 py-1 rounded transition ${
                sortMode === "kickoff" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-3 h-3" /> Kickoff
            </button>
            <button
              onClick={() => setSortMode("popular")}
              className={`flex items-center gap-1 px-2 py-1 rounded transition ${
                sortMode === "popular" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="w-3 h-3" /> Popular
            </button>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {notice && (
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-4 text-center">
          <p className="text-sm text-foreground">{notice}</p>
        </div>
      )}

      {loading && matches.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground text-sm">Loading live odds...</span>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={refetch} className="text-xs text-primary hover:underline mt-1">
            Try again
          </button>
        </div>
      )}

      {!loading || matches.length > 0 ? (
        <>
          {liveMatches.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-live live-pulse" />
                <h2 className="font-display text-lg font-bold uppercase tracking-wider">Live Events</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{liveMatches.length}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {liveMatches.map((match) => (
                  <MatchCard key={match.matchId} match={match} />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-display text-lg font-bold uppercase tracking-wider">
                {upcomingMatches.length > 0 ? "Upcoming Matches" : matches.length === 0 && !loading ? "No Matches Found" : ""}
              </h2>
              {upcomingMatches.length > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{upcomingMatches.length}</span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcomingMatches.map((match) => (
                <MatchCard key={match.matchId} match={match} />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
};

export default LiveMatchesFeed;
