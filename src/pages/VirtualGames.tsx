import { useState } from "react";
import TopBar from "@/components/TopBar";
import { Plane, TrendingUp, Bomb, Dices, Circle, Zap, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { useGameSound } from "@/components/games/useGameSound";
import AviatorGame from "@/components/games/AviatorGame";
import MinesGame from "@/components/games/MinesGame";
import DiceGame from "@/components/games/DiceGame";
import PlinkoGame from "@/components/games/PlinkoGame";
import RouletteGame from "@/components/games/RouletteGame";
import CrashGame from "@/components/games/CrashGame";
import Leaderboard from "@/components/games/Leaderboard";

type GameType = "aviator" | "mines" | "plinko" | "dice" | "roulette" | "crash";

const GAMES: { id: GameType; name: string; icon: typeof Plane; desc: string }[] = [
  { id: "aviator", name: "Aviator", icon: Plane, desc: "Cash out before the plane flies away" },
  { id: "crash", name: "Crash", icon: TrendingUp, desc: "Ride the multiplier curve" },
  { id: "mines", name: "Mines", icon: Bomb, desc: "Reveal gems, avoid bombs" },
  { id: "dice", name: "Dice", icon: Dices, desc: "Roll over or under your target" },
  { id: "roulette", name: "Roulette", icon: Circle, desc: "Bet on red, black, or green" },
  { id: "plinko", name: "Plinko", icon: Zap, desc: "Drop the ball and win multipliers" },
];

const VirtualGames = () => {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const { soundEnabled, setSoundEnabled, play } = useGameSound();

  const renderGame = () => {
    switch (activeGame) {
      case "aviator": return <AviatorGame play={play} />;
      case "mines": return <MinesGame play={play} />;
      case "dice": return <DiceGame play={play} />;
      case "plinko": return <PlinkoGame play={play} />;
      case "roulette": return <RouletteGame play={play} />;
      case "crash": return <CrashGame play={play} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen">
      <TopBar />

      {activeGame ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card shrink-0">
            <button onClick={() => setActiveGame(null)} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <h2 className="font-display font-bold text-sm flex items-center gap-2">
              {GAMES.find(g => g.id === activeGame)?.name}
              <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
            </h2>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-md hover:bg-secondary transition">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {renderGame()}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl font-bold">Virtual Games</h1>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-md hover:bg-secondary transition">
              {soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {GAMES.map((g) => {
              const Icon = g.icon;
              return (
                <button key={g.id} onClick={() => { setActiveGame(g.id); play("click"); }}
                  className="relative bg-card border border-border rounded-xl p-5 text-center transition hover:border-primary hover:bg-primary/5 group">
                  <div className="w-14 h-14 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">{g.name}</h3>
                  <p className="text-[10px] text-muted-foreground leading-tight">{g.desc}</p>
                  <span className="absolute top-2 right-2 text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
                </button>
              );
            })}
          </div>
          <Leaderboard />
        </div>
      )}
    </div>
  );
};

export default VirtualGames;
