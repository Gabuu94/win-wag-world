export interface MatchData {
  matchId: string;
  league: string;
  sport: string;
  team1: string;
  team2: string;
  score1?: number;
  score2?: number;
  time: string;
  isLive: boolean;
  odds: { home: number; draw: number; away: number };
  totalMarkets: number;
  extraMarkets?: { name: string; options: { label: string; odds: number }[] }[];
}

export const liveMatches: MatchData[] = [
  {
    matchId: "live-1", league: "UEFA Champions League", sport: "football",
    team1: "FC Barcelona", team2: "Paris Saint-Germain", score1: 2, score2: 1, time: "67'", isLive: true,
    odds: { home: 1.65, draw: 3.8, away: 5.2 }, totalMarkets: 156,
    extraMarkets: [
      { name: "Both Teams to Score", options: [{ label: "Yes", odds: 1.45 }, { label: "No", odds: 2.6 }] },
      { name: "Over/Under 2.5 Goals", options: [{ label: "Over", odds: 1.55 }, { label: "Under", odds: 2.4 }] },
      { name: "Next Goal", options: [{ label: "Barcelona", odds: 1.7 }, { label: "No Goal", odds: 6.5 }, { label: "PSG", odds: 3.2 }] },
      { name: "Double Chance", options: [{ label: "1X", odds: 1.15 }, { label: "12", odds: 1.2 }, { label: "X2", odds: 2.1 }] },
    ],
  },
  {
    matchId: "live-2", league: "UEFA Champions League", sport: "football",
    team1: "Manchester City", team2: "Real Madrid", score1: 0, score2: 0, time: "32'", isLive: true,
    odds: { home: 2.1, draw: 3.4, away: 3.5 }, totalMarkets: 148,
    extraMarkets: [
      { name: "Both Teams to Score", options: [{ label: "Yes", odds: 1.65 }, { label: "No", odds: 2.15 }] },
      { name: "Over/Under 2.5 Goals", options: [{ label: "Over", odds: 2.0 }, { label: "Under", odds: 1.8 }] },
      { name: "Total Corners Over/Under 9.5", options: [{ label: "Over", odds: 1.85 }, { label: "Under", odds: 1.95 }] },
    ],
  },
  {
    matchId: "live-3", league: "English Premier League", sport: "football",
    team1: "Arsenal", team2: "Liverpool", score1: 1, score2: 2, time: "78'", isLive: true,
    odds: { home: 3.2, draw: 3.6, away: 2.1 }, totalMarkets: 134,
    extraMarkets: [
      { name: "Both Teams to Score", options: [{ label: "Yes", odds: 1.2 }, { label: "No", odds: 4.5 }] },
      { name: "Over/Under 3.5 Goals", options: [{ label: "Over", odds: 2.1 }, { label: "Under", odds: 1.7 }] },
    ],
  },
  {
    matchId: "live-4", league: "La Liga", sport: "football",
    team1: "Real Sociedad", team2: "Atletico Madrid", score1: 0, score2: 1, time: "55'", isLive: true,
    odds: { home: 3.8, draw: 3.2, away: 2.0 }, totalMarkets: 112,
    extraMarkets: [
      { name: "Over/Under 1.5 Goals", options: [{ label: "Over", odds: 1.6 }, { label: "Under", odds: 2.3 }] },
    ],
  },
  {
    matchId: "live-5", league: "NBA", sport: "basketball",
    team1: "Golden State Warriors", team2: "Milwaukee Bucks", score1: 88, score2: 92, time: "Q3 4:22", isLive: true,
    odds: { home: 2.4, draw: 15.0, away: 1.6 }, totalMarkets: 95,
    extraMarkets: [
      { name: "Total Points Over/Under 220.5", options: [{ label: "Over", odds: 1.9 }, { label: "Under", odds: 1.9 }] },
      { name: "Handicap (-4.5 Bucks)", options: [{ label: "Warriors +4.5", odds: 1.85 }, { label: "Bucks -4.5", odds: 1.95 }] },
    ],
  },
  {
    matchId: "live-6", league: "ATP Australian Open", sport: "tennis",
    team1: "J. Sinner", team2: "D. Medvedev", score1: 2, score2: 1, time: "Set 4", isLive: true,
    odds: { home: 1.35, draw: 8.0, away: 3.2 }, totalMarkets: 48,
    extraMarkets: [
      { name: "Total Sets", options: [{ label: "4 Sets", odds: 2.5 }, { label: "5 Sets", odds: 2.8 }] },
    ],
  },
];

export const upcomingMatches: MatchData[] = [
  {
    matchId: "up-1", league: "Serie A", sport: "football",
    team1: "AC Milan", team2: "Juventus", time: "Today 20:45", isLive: false,
    odds: { home: 2.5, draw: 3.2, away: 2.9 }, totalMarkets: 185,
    extraMarkets: [
      { name: "Both Teams to Score", options: [{ label: "Yes", odds: 1.7 }, { label: "No", odds: 2.05 }] },
      { name: "Over/Under 2.5 Goals", options: [{ label: "Over", odds: 2.1 }, { label: "Under", odds: 1.75 }] },
      { name: "Correct Score", options: [{ label: "1-0", odds: 7.0 }, { label: "1-1", odds: 5.5 }, { label: "0-1", odds: 8.0 }, { label: "2-1", odds: 9.0 }] },
    ],
  },
  {
    matchId: "up-2", league: "Bundesliga", sport: "football",
    team1: "Bayern Munich", team2: "Borussia Dortmund", time: "Today 21:30", isLive: false,
    odds: { home: 1.55, draw: 4.2, away: 5.8 }, totalMarkets: 198,
    extraMarkets: [
      { name: "Both Teams to Score", options: [{ label: "Yes", odds: 1.55 }, { label: "No", odds: 2.35 }] },
      { name: "Over/Under 3.5 Goals", options: [{ label: "Over", odds: 1.8 }, { label: "Under", odds: 2.0 }] },
      { name: "First Half Result", options: [{ label: "Bayern", odds: 1.8 }, { label: "Draw", odds: 2.8 }, { label: "Dortmund", odds: 6.5 }] },
    ],
  },
  {
    matchId: "up-3", league: "Ligue 1", sport: "football",
    team1: "PSG", team2: "Olympique Lyon", time: "Tomorrow 19:00", isLive: false,
    odds: { home: 1.3, draw: 5.5, away: 9.0 }, totalMarkets: 172,
    extraMarkets: [
      { name: "Over/Under 2.5 Goals", options: [{ label: "Over", odds: 1.6 }, { label: "Under", odds: 2.3 }] },
    ],
  },
  {
    matchId: "up-4", league: "NBA", sport: "basketball",
    team1: "LA Lakers", team2: "Boston Celtics", time: "Tomorrow 02:00", isLive: false,
    odds: { home: 2.3, draw: 15.0, away: 1.65 }, totalMarkets: 110,
    extraMarkets: [
      { name: "Total Points Over/Under 215.5", options: [{ label: "Over", odds: 1.85 }, { label: "Under", odds: 1.95 }] },
      { name: "Handicap (-3.5 Celtics)", options: [{ label: "Lakers +3.5", odds: 1.9 }, { label: "Celtics -3.5", odds: 1.9 }] },
    ],
  },
  {
    matchId: "up-5", league: "ATP Tour", sport: "tennis",
    team1: "C. Alcaraz", team2: "N. Djokovic", time: "Tomorrow 14:00", isLive: false,
    odds: { home: 1.9, draw: 8.0, away: 1.95 }, totalMarkets: 55,
    extraMarkets: [
      { name: "Total Sets Over/Under 3.5", options: [{ label: "Over", odds: 1.75 }, { label: "Under", odds: 2.05 }] },
    ],
  },
  {
    matchId: "up-6", league: "English Premier League", sport: "football",
    team1: "Chelsea", team2: "Tottenham", time: "Sat 17:30", isLive: false,
    odds: { home: 2.2, draw: 3.4, away: 3.3 }, totalMarkets: 190,
    extraMarkets: [
      { name: "Both Teams to Score", options: [{ label: "Yes", odds: 1.6 }, { label: "No", odds: 2.2 }] },
      { name: "Over/Under 2.5 Goals", options: [{ label: "Over", odds: 1.85 }, { label: "Under", odds: 1.95 }] },
    ],
  },
  {
    matchId: "up-7", league: "UFC Fight Night", sport: "mma",
    team1: "A. Volkanovski", team2: "I. Topuria", time: "Sat 23:00", isLive: false,
    odds: { home: 2.6, draw: 20.0, away: 1.55 }, totalMarkets: 35,
    extraMarkets: [
      { name: "Method of Victory", options: [{ label: "KO/TKO", odds: 2.2 }, { label: "Decision", odds: 2.8 }, { label: "Submission", odds: 5.0 }] },
      { name: "Fight to go the Distance", options: [{ label: "Yes", odds: 2.3 }, { label: "No", odds: 1.6 }] },
    ],
  },
  {
    matchId: "up-8", league: "NHL", sport: "hockey",
    team1: "Edmonton Oilers", team2: "Toronto Maple Leafs", time: "Sun 01:00", isLive: false,
    odds: { home: 2.15, draw: 3.8, away: 3.1 }, totalMarkets: 78,
    extraMarkets: [
      { name: "Total Goals Over/Under 5.5", options: [{ label: "Over", odds: 1.8 }, { label: "Under", odds: 2.0 }] },
    ],
  },
];

export const allMatches = [...liveMatches, ...upcomingMatches];

export const getMatchById = (id: string): MatchData | undefined =>
  allMatches.find((m) => m.matchId === id);
