import MatchCard from "./MatchCard";
import HeroBanner from "./HeroBanner";

const liveMatches = [
  { league: "UEFA Champions League", team1: "FC Barcelona", team2: "Paris Saint-Germain", score1: 2, score2: 1, time: "67'", isLive: true, odds: { home: 1.65, draw: 3.8, away: 5.2 } },
  { league: "UEFA Champions League", team1: "Manchester City", team2: "Real Madrid", score1: 0, score2: 0, time: "32'", isLive: true, odds: { home: 2.1, draw: 3.4, away: 3.5 } },
  { league: "English Premier League", team1: "Arsenal", team2: "Liverpool", score1: 1, score2: 2, time: "78'", isLive: true, odds: { home: 3.2, draw: 3.6, away: 2.1 } },
  { league: "La Liga", team1: "Real Sociedad", team2: "Atletico Madrid", score1: 0, score2: 1, time: "55'", isLive: true, odds: { home: 3.8, draw: 3.2, away: 2.0 } },
];

const upcomingMatches = [
  { league: "Serie A", team1: "AC Milan", team2: "Juventus", time: "Today 20:45", isLive: false, odds: { home: 2.5, draw: 3.2, away: 2.9 } },
  { league: "Bundesliga", team1: "Bayern Munich", team2: "Borussia Dortmund", time: "Today 21:30", isLive: false, odds: { home: 1.55, draw: 4.2, away: 5.8 } },
  { league: "Ligue 1", team1: "PSG", team2: "Olympique Lyon", time: "Tomorrow 19:00", isLive: false, odds: { home: 1.3, draw: 5.5, away: 9.0 } },
  { league: "NBA", team1: "LA Lakers", team2: "Boston Celtics", time: "Tomorrow 02:00", isLive: false, odds: { home: 2.3, draw: 15.0, away: 1.65 } },
  { league: "ATP Tour", team1: "C. Alcaraz", team2: "N. Djokovic", time: "Tomorrow 14:00", isLive: false, odds: { home: 1.9, draw: 8.0, away: 1.95 } },
  { league: "English Premier League", team1: "Chelsea", team2: "Tottenham", time: "Sat 17:30", isLive: false, odds: { home: 2.2, draw: 3.4, away: 3.3 } },
];

const LiveMatchesFeed = () => {
  return (
    <main className="flex-1 overflow-y-auto p-4 h-[calc(100vh-8rem)]">
      <HeroBanner />

      {/* Live section */}
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
          {liveMatches.map((match, i) => (
            <MatchCard key={i} {...match} />
          ))}
        </div>
      </div>

      {/* Upcoming */}
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
          {upcomingMatches.map((match, i) => (
            <MatchCard key={i} {...match} />
          ))}
        </div>
      </div>
    </main>
  );
};

export default LiveMatchesFeed;
