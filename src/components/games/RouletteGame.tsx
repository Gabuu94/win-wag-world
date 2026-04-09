import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Props { play: (s: "bet"|"win"|"lose"|"click"|"cashout"|"tick"|"reveal"|"bomb") => void; }
const PRESET_STAKES = [10, 25, 50, 100, 250, 500];
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

type BetType = "red" | "black" | "green" | "odd" | "even" | "1-18" | "19-36";
const BET_OPTIONS: { type: BetType; label: string; color: string; multiplier: number }[] = [
  { type: "red", label: "Red", color: "bg-red-600", multiplier: 2 },
  { type: "black", label: "Black", color: "bg-gray-900", multiplier: 2 },
  { type: "green", label: "0 Green", color: "bg-green-600", multiplier: 36 },
  { type: "odd", label: "Odd", color: "bg-secondary", multiplier: 2 },
  { type: "even", label: "Even", color: "bg-secondary", multiplier: 2 },
  { type: "1-18", label: "1-18", color: "bg-secondary", multiplier: 2 },
  { type: "19-36", label: "19-36", color: "bg-secondary", multiplier: 2 },
];

const RouletteGame = ({ play }: Props) => {
  const { isLoggedIn, profile, setShowAuthModal, deposit, withdraw } = useAuth();
  const [stake, setStake] = useState(50);
  const [betType, setBetType] = useState<BetType>("red");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<{ num: number; won: boolean; payout: number }[]>([]);

  const getColor = (n: number) => n === 0 ? "green" : RED_NUMBERS.includes(n) ? "red" : "black";

  const isWin = (num: number, bet: BetType) => {
    if (bet === "red") return RED_NUMBERS.includes(num);
    if (bet === "black") return num > 0 && !RED_NUMBERS.includes(num);
    if (bet === "green") return num === 0;
    if (bet === "odd") return num > 0 && num % 2 === 1;
    if (bet === "even") return num > 0 && num % 2 === 0;
    if (bet === "1-18") return num >= 1 && num <= 18;
    if (bet === "19-36") return num >= 19 && num <= 36;
    return false;
  };

  const spin = async () => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    if (!profile || profile.balance < stake) { toast.error("Insufficient balance"); return; }
    if (spinning) return;
    const ok = await withdraw(stake);
    if (!ok) return;
    play("bet");
    setSpinning(true);
    setResult(null);

    // Animate through numbers
    let count = 0;
    const interval = setInterval(() => {
      setResult(Math.floor(Math.random() * 37));
      play("tick");
      count++;
      if (count >= 20) {
        clearInterval(interval);
        const final = Math.floor(Math.random() * 37);
        setResult(final);
        setSpinning(false);
        const won = isWin(final, betType);
        const mult = BET_OPTIONS.find(b => b.type === betType)?.multiplier || 2;
        if (won) {
          const payout = stake * mult;
          deposit(payout);
          play("win");
          toast.success(`🎰 ${final} ${getColor(final)} — Won $${payout.toFixed(2)}!`);
          setHistory(prev => [{ num: final, won: true, payout }, ...prev].slice(0, 20));
        } else {
          play("lose");
          toast.error(`🎰 ${final} ${getColor(final)} — Lost!`);
          setHistory(prev => [{ num: final, won: false, payout: 0 }, ...prev].slice(0, 20));
        }
      }
    }, 80);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="bg-card border border-border rounded-xl p-6 flex-1 flex flex-col items-center justify-center">
        <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-display font-bold border-4 transition-all
          ${result === null ? "border-muted-foreground/30 text-muted-foreground" : 
            getColor(result) === "red" ? "border-red-500 text-red-500 bg-red-500/10" :
            getColor(result) === "green" ? "border-green-500 text-green-500 bg-green-500/10" :
            "border-foreground text-foreground bg-foreground/10"}`}>
          {spinning ? "?" : result !== null ? result : "—"}
        </div>
        {result !== null && !spinning && (
          <p className="mt-2 text-sm font-bold capitalize">{getColor(result)}</p>
        )}

        <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1">
          {history.slice(0, 10).map((h, i) => (
            <span key={i} className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white
              ${getColor(h.num) === "red" ? "bg-red-600" : getColor(h.num) === "green" ? "bg-green-600" : "bg-gray-800"}`}>{h.num}</span>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 shrink-0">
        <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Bet On</label>
        <div className="grid grid-cols-4 gap-1 mb-3">
          {BET_OPTIONS.map(b => (
            <button key={b.type} onClick={() => { setBetType(b.type); play("click"); }} disabled={spinning}
              className={`py-1.5 rounded text-xs font-bold transition ${betType === b.type ? "ring-2 ring-primary" : ""}
                ${b.type === "red" ? "bg-red-600/80 text-white" : b.type === "black" ? "bg-gray-800 text-white" : b.type === "green" ? "bg-green-600/80 text-white" : "bg-secondary text-muted-foreground"}`}>
              {b.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid grid-cols-3 gap-1">
            {PRESET_STAKES.map(a => (
              <button key={a} onClick={() => { setStake(a); play("click"); }} disabled={spinning}
                className={`py-1.5 rounded text-xs font-medium ${stake === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>${a}</button>
            ))}
          </div>
          <button onClick={spin} disabled={spinning}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md font-bold text-sm uppercase disabled:opacity-40">
            {spinning ? "Spinning..." : `Spin — $${stake}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouletteGame;
