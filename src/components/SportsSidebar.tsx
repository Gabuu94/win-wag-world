import {
  Trophy,
  Flame,
  Timer,
  Star,
  TrendingUp,
  Tv,
  Zap,
  Dribbble,
  Swords,
  Target,
  Bike,
  Flag,
  Volleyball,
  Gamepad2,
} from "lucide-react";

const SPORTS = [
  { key: "upcoming", icon: Flame, label: "All Sports", highlight: true },
  { key: "soccer", icon: Dribbble, label: "⚽ Football" },
  { key: "basketball_nba", icon: Target, label: "🏀 NBA" },
  { key: "basketball_euroleague", icon: Target, label: "🏀 Euroleague" },
  { key: "icehockey_nhl", icon: Flag, label: "🏒 NHL" },
  { key: "americanfootball_nfl", icon: Flag, label: "🏈 NFL" },
  { key: "baseball_mlb", icon: Bike, label: "⚾ MLB" },
  { key: "mma_mixed_martial_arts", icon: Swords, label: "🥊 MMA" },
  { key: "tennis_atp_french_open", icon: Volleyball, label: "🎾 Tennis ATP" },
  { key: "tennis_wta_french_open", icon: Volleyball, label: "🎾 Tennis WTA" },
  { key: "rugbyleague_nrl", icon: Dribbble, label: "🏉 Rugby NRL" },
  { key: "aussierules_afl", icon: Dribbble, label: "🏉 AFL" },
  { key: "cricket_test_match", icon: Target, label: "🏏 Cricket" },
  { key: "boxing_boxing", icon: Swords, label: "🥊 Boxing" },
  { key: "golf_masters_tournament_winner", icon: Flag, label: "⛳ Golf" },
];

const QUICK_LINKS = [
  { icon: Timer, label: "Starting Soon", key: "starting_soon" },
  { icon: Star, label: "Favorites", key: "favorites" },
  { icon: TrendingUp, label: "Popular", key: "popular" },
  { icon: Tv, label: "Virtuals", key: "virtuals" },
  { icon: Zap, label: "Express", key: "express" },
];

const TOP_LEAGUES = [
  { name: "UEFA Champions League", key: "soccer_uefa_champs_league" },
  { name: "English Premier League", key: "soccer_epl" },
  { name: "La Liga", key: "soccer_spain_la_liga" },
  { name: "Serie A", key: "soccer_italy_serie_a" },
  { name: "Bundesliga", key: "soccer_germany_bundesliga" },
  { name: "Ligue 1", key: "soccer_france_ligue_one" },
  { name: "NBA", key: "basketball_nba" },
  { name: "NHL", key: "icehockey_nhl" },
  { name: "NFL", key: "americanfootball_nfl" },
  { name: "MLB", key: "baseball_mlb" },
  { name: "UFC / MMA", key: "mma_mixed_martial_arts" },
];

interface SportsSidebarProps {
  activeSport: string;
  onSportChange: (sport: string) => void;
}

const SportsSidebar = ({ activeSport, onSportChange }: SportsSidebarProps) => {
  return (
    <aside className="hidden lg:flex flex-col w-56 bg-card border-r border-border overflow-y-auto h-[calc(100vh-8rem)]">
      <div className="p-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Sports
        </h3>
        {SPORTS.map((sport) => (
          <button
            key={sport.key}
            onClick={() => onSportChange(sport.key)}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition ${
              activeSport === sport.key
                ? "bg-primary/10 text-primary font-medium"
                : "text-secondary-foreground hover:bg-secondary"
            }`}
          >
            <sport.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{sport.label}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-border p-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Top Leagues
        </h3>
        {TOP_LEAGUES.map((league) => (
          <button
            key={league.key}
            onClick={() => onSportChange(league.key)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition ${
              activeSport === league.key
                ? "bg-primary/10 text-primary"
                : "text-secondary-foreground hover:bg-secondary"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-accent" />
            <span className="flex-1 text-left text-xs">{league.name}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default SportsSidebar;
