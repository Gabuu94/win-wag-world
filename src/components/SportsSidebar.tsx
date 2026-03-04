import {
  Trophy,
  Flame,
  Timer,
  Star,
  TrendingUp,
  Tv,
  Zap,
} from "lucide-react";

const menuItems = [
  { icon: Flame, label: "Live & Hot", count: 128, highlight: true },
  { icon: Timer, label: "Starting Soon", count: 54 },
  { icon: Star, label: "Favorites", count: 3 },
  { icon: TrendingUp, label: "Popular", count: 89 },
  { icon: Tv, label: "Virtuals" },
  { icon: Zap, label: "Express" },
];

const leagues = [
  { name: "UEFA Champions League", count: 8 },
  { name: "English Premier League", count: 10 },
  { name: "La Liga", count: 10 },
  { name: "Serie A", count: 10 },
  { name: "Bundesliga", count: 9 },
  { name: "Ligue 1", count: 10 },
  { name: "NBA", count: 15 },
  { name: "ATP Tour", count: 12 },
];

const SportsSidebar = () => {
  return (
    <aside className="hidden lg:flex flex-col w-56 bg-card border-r border-border overflow-y-auto h-[calc(100vh-8rem)]">
      <div className="p-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Quick Access
        </h3>
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition ${
              item.highlight
                ? "bg-primary/10 text-primary"
                : "text-secondary-foreground hover:bg-secondary"
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.count && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="border-t border-border p-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Top Leagues
        </h3>
        {leagues.map((league) => (
          <button
            key={league.name}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-secondary-foreground hover:bg-secondary transition"
          >
            <Trophy className="w-3.5 h-3.5 text-accent" />
            <span className="flex-1 text-left text-xs">{league.name}</span>
            <span className="text-xs text-muted-foreground">{league.count}</span>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default SportsSidebar;
