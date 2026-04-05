import MatchCard from "./MatchCard";
import HeroBanner from "./HeroBanner";
import { useOdds } from "@/hooks/useOdds";
import { Loader2, RefreshCw } from "lucide-react";

interface LiveMatchesFeedProps {
  sportKey?: string;
  searchQuery?: string;
}

const LiveMatchesFeed = ({ sportKey = "upcoming", searchQuery = "" }: LiveMatchesFeedProps) => {
  const { matches: rawMatches, loading, error, notice, lastUpdated, refetch } = useOdds(sportKey);

  const matches = searchQuery.trim()
    ? rawMatches.filter((m) => {
        const q = searchQuery.toLowerCase();
        return m.team1.toLowerCase().includes(q) || m.team2.toLowerCase().includes(q) || m.league.toLowerCase().includes(q);
      })
    : rawMatches;

  const liveMatches = matches.filter((m) => m.isLive);
  const upcomingMatches = matches.filter((m) => !m.isLive);

  return (
    <main className="flex-1 overflow-y-auto p-4 h-[calc(100vh-8rem)]">
      <HeroBanner />

      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted-foreground">
          {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString()}`}
          {matches.length > 0 && ` · ${matches.length} events`}
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
