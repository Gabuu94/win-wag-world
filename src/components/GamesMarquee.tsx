import { useNavigate } from "react-router-dom";
import { Plane, TrendingUp, Bomb, Dices, Circle, Zap } from "lucide-react";

const GAMES = [
  { name: "Aviator", icon: Plane, color: "text-red-500" },
  { name: "Crash", icon: TrendingUp, color: "text-green-500" },
  { name: "Mines", icon: Bomb, color: "text-yellow-500" },
  { name: "Dice", icon: Dices, color: "text-blue-500" },
  { name: "Roulette", icon: Circle, color: "text-purple-500" },
  { name: "Plinko", icon: Zap, color: "text-orange-500" },
];

const GamesMarquee = () => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate("/virtuals")}
      className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-y border-border overflow-hidden cursor-pointer hover:from-primary/15 hover:via-accent/15 hover:to-primary/15 transition-colors"
    >
      <div className="flex animate-marquee whitespace-nowrap py-2">
        {[...GAMES, ...GAMES, ...GAMES].map((g, i) => {
          const Icon = g.icon;
          return (
            <div key={i} className="inline-flex items-center gap-1.5 mx-4">
              <Icon className={`w-4 h-4 ${g.color}`} />
              <span className="text-xs font-bold">{g.name}</span>
              <span className="text-[8px] bg-primary/20 text-primary px-1 py-0.5 rounded-full font-bold">PLAY</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GamesMarquee;
