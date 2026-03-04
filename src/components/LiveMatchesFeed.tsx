import MatchCard from "./MatchCard";
import HeroBanner from "./HeroBanner";
import { liveMatches, upcomingMatches } from "@/data/matches";

const LiveMatchesFeed = () => {
  return (
    <main className="flex-1 overflow-y-auto p-4 h-[calc(100vh-8rem)]">
      <HeroBanner />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-live live-pulse" />
          <h2 className="font-display text-lg font-bold uppercase tracking-wider">
            Live Events
          </h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {liveMatches.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {liveMatches.map((match) => (
            <MatchCard key={match.matchId} match={match} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider">
            Upcoming Matches
          </h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {upcomingMatches.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {upcomingMatches.map((match) => (
            <MatchCard key={match.matchId} match={match} />
          ))}
        </div>
      </div>
    </main>
  );
};

export default LiveMatchesFeed;
