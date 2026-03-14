import MatchCard from "./MatchCard";
import HeroBanner from "./HeroBanner";
import { useOdds, NormalizedMatch } from "@/hooks/useOdds";
import { Loader2 } from "lucide-react";

interface LiveMatchesFeedProps {
  sportKey?: string;
}

const LiveMatchesFeed = ({ sportKey = "upcoming" }: LiveMatchesFeedProps) => {
  const { matches, loading, error } = useOdds(sportKey);

  const now = new Date();
  const liveMatches = matches.filter((m) => m.isLive);
  const upcomingMatches = matches.filter((m) => !m.isLive);

  return (
    <main className="flex-1 overflow-y-auto p-4 h-[calc(100vh-8rem)]">
      <HeroBanner />

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground text-sm">Loading live odds...</span>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">Odds data will refresh automatically</p>
        </div>
      )}

      {!loading && !error && (
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
                {upcomingMatches.length > 0 ? "Upcoming Matches" : "No Matches Found"}
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
      )}
    </main>
  );
};

export default LiveMatchesFeed;
