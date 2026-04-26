import { useState } from "react";
import { Trophy, TrendingUp, Banknote } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatMoney } from "@/lib/currency";

interface LeaderEntry {
  rank: number;
  player: string;
  game: string;
  amount: number;
  multiplier?: number;
}

// Demo leaderboard data (in production this would come from DB)
const TOP_WINNERS: LeaderEntry[] = [
  { rank: 1, player: "Lucky***", game: "Aviator", amount: 12500, multiplier: 25.4 },
  { rank: 2, player: "Bet***", game: "Crash", amount: 8900, multiplier: 18.2 },
  { rank: 3, player: "Win***", game: "Mines", amount: 6200, multiplier: 12.8 },
  { rank: 4, player: "Pro***", game: "Roulette", amount: 5100, multiplier: 36.0 },
  { rank: 5, player: "Ace***", game: "Dice", amount: 4300, multiplier: 9.8 },
  { rank: 6, player: "Max***", game: "Plinko", amount: 3800, multiplier: 5.6 },
  { rank: 7, player: "Top***", game: "Aviator", amount: 3200, multiplier: 8.1 },
  { rank: 8, player: "Hot***", game: "Crash", amount: 2900, multiplier: 14.5 },
];

const HIGHEST_MULTI: LeaderEntry[] = [
  { rank: 1, player: "Fly***", game: "Aviator", amount: 5000, multiplier: 125.6 },
  { rank: 2, player: "Sky***", game: "Crash", amount: 200, multiplier: 98.3 },
  { rank: 3, player: "Rkt***", game: "Aviator", amount: 100, multiplier: 67.2 },
  { rank: 4, player: "Gem***", game: "Roulette", amount: 50, multiplier: 36.0 },
  { rank: 5, player: "Dia***", game: "Crash", amount: 500, multiplier: 32.1 },
  { rank: 6, player: "Str***", game: "Aviator", amount: 1000, multiplier: 28.9 },
  { rank: 7, player: "Blz***", game: "Mines", amount: 25, multiplier: 24.0 },
  { rank: 8, player: "Nva***", game: "Crash", amount: 300, multiplier: 19.7 },
];

const BIGGEST_CASHOUTS: LeaderEntry[] = [
  { rank: 1, player: "Kin***", game: "Aviator", amount: 25000 },
  { rank: 2, player: "Qen***", game: "Crash", amount: 18500 },
  { rank: 3, player: "Jkr***", game: "Mines", amount: 15200 },
  { rank: 4, player: "Vip***", game: "Roulette", amount: 12800 },
  { rank: 5, player: "Big***", game: "Aviator", amount: 10500 },
  { rank: 6, player: "Mny***", game: "Dice", amount: 8900 },
  { rank: 7, player: "Gld***", game: "Plinko", amount: 7200 },
  { rank: 8, player: "Plt***", game: "Crash", amount: 6100 },
];

const TABS = [
  { key: "winners", label: "Top Winners", icon: Trophy, data: TOP_WINNERS },
  { key: "multi", label: "Highest Multi", icon: TrendingUp, data: HIGHEST_MULTI },
  { key: "cashouts", label: "Biggest Cashouts", icon: Banknote, data: BIGGEST_CASHOUTS },
] as const;

const Leaderboard = () => {
  const [tab, setTab] = useState<string>("winners");
  const { profile } = useAuth();
  const active = TABS.find(t => t.key === tab) || TABS[0];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex border-b border-border">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition
                ${tab === t.key ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.label.split(" ")[1] || t.label}</span>
            </button>
          );
        })}
      </div>
      <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
        {active.data.map((entry) => (
          <div key={entry.rank} className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 transition">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
              ${entry.rank === 1 ? "bg-yellow-500/20 text-yellow-500" : entry.rank === 2 ? "bg-gray-400/20 text-gray-400" : entry.rank === 3 ? "bg-orange-600/20 text-orange-600" : "bg-secondary text-muted-foreground"}`}>
              {entry.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{entry.player}</p>
              <p className="text-[10px] text-muted-foreground">{entry.game}</p>
            </div>
            {entry.multiplier && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                {entry.multiplier}x
              </span>
            )}
            <span className="text-xs font-bold text-primary">{formatMoney(entry.amount, profile)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
