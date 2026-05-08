import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { Dices } from "lucide-react";

interface Props { play: (s: "bet"|"win"|"lose"|"click"|"cashout"|"tick"|"reveal"|"bomb") => void; }
const PRESET_STAKES = [10, 25, 50, 100, 250, 500];

const DiceGame = ({ play }: Props) => {
  const { isLoggedIn, profile, setShowAuthModal, deposit, withdraw } = useAuth();
  const { isAdmin } = useAdmin();
  const [stake, setStake] = useState(50);
  const [target, setTarget] = useState(50);
  const [rollOver, setRollOver] = useState(true);
  const [result, setResult] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<{ result: number; target: number; won: boolean; payout: number }[]>([]);

  const winChance = rollOver ? (100 - target) : target;
  const multiplierCalc = winChance > 0 ? Math.floor((98 / winChance) * 100) / 100 : 0;

  const rollDice = async () => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    if (!isAdmin && (!profile || profile.balance < stake)) { toast.error("Insufficient balance"); return; }
    const ok = await withdraw(stake);
    if (!ok) return;
    play("bet");
    setRolling(true);
    
    // Animate
    let count = 0;
    const interval = setInterval(() => {
      setResult(Math.random() * 100);
      play("tick");
      count++;
      if (count >= 15) {
        clearInterval(interval);
        const final = Math.round(Math.random() * 10000) / 100;
        setResult(final);
        setRolling(false);
        const won = rollOver ? final > target : final < target;
        if (won) {
          const payout = Math.floor(stake * multiplierCalc * 100) / 100;
          deposit(payout);
          play("win");
          toast.success(`🎲 ${final.toFixed(2)} — Won $${payout.toFixed(2)}!`);
          setHistory(prev => [{ result: final, target, won: true, payout }, ...prev].slice(0, 20));
        } else {
          play("lose");
          toast.error(`🎲 ${final.toFixed(2)} — Lost!`);
          setHistory(prev => [{ result: final, target, won: false, payout: 0 }, ...prev].slice(0, 20));
        }
      }
    }, 60);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="bg-card border border-border rounded-xl p-6 flex-1 flex flex-col items-center justify-center">
        <Dices className="w-16 h-16 text-primary mb-4" />
        <p className="font-display text-6xl font-bold mb-2" style={{ color: result === null ? undefined : (rollOver ? (result > target ? "hsl(142,71%,45%)" : "hsl(0,84%,60%)") : (result < target ? "hsl(142,71%,45%)" : "hsl(0,84%,60%)")) }}>
          {result !== null ? result.toFixed(2) : "—"}
        </p>
        <p className="text-sm text-muted-foreground">{rollOver ? "Roll Over" : "Roll Under"} {target.toFixed(0)}</p>
        <div className="w-full max-w-md mt-4">
          <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
            <div className={`absolute h-full ${rollOver ? "right-0 bg-primary/30" : "left-0 bg-primary/30"}`} style={{ width: `${winChance}%` }} />
            {result !== null && <div className="absolute top-0 h-full w-0.5 bg-foreground" style={{ left: `${result}%` }} />}
          </div>
          <input type="range" min={2} max={98} value={target} onChange={e => setTarget(Number(e.target.value))}
            className="w-full mt-2 accent-primary" disabled={rolling} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2 text-xs">
            <span className="text-muted-foreground">Win: <span className="text-foreground font-bold">{winChance.toFixed(1)}%</span></span>
            <span className="text-muted-foreground">Multi: <span className="text-foreground font-bold">{multiplierCalc.toFixed(2)}x</span></span>
          </div>
          <button onClick={() => { setRollOver(!rollOver); play("click"); }} disabled={rolling}
            className="text-xs bg-secondary px-3 py-1 rounded-md font-bold">{rollOver ? "Over ↑" : "Under ↓"}</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid grid-cols-3 gap-1">
            {PRESET_STAKES.map(a => (
              <button key={a} onClick={() => { setStake(a); play("click"); }} disabled={rolling}
                className={`py-1.5 rounded text-xs font-medium ${stake === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>${a}</button>
            ))}
          </div>
          <button onClick={rollDice} disabled={rolling}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md font-bold text-sm uppercase disabled:opacity-40">
            {rolling ? "Rolling..." : `Roll — $${stake}`}
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 shrink-0 max-h-28 overflow-y-auto">
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className={`flex justify-between text-xs py-1 px-2 rounded ${h.won ? "bg-primary/10" : "bg-destructive/10"}`}>
                <span>{h.result.toFixed(2)}</span>
                <span className={h.won ? "text-primary font-bold" : "text-destructive font-bold"}>{h.won ? `+$${h.payout.toFixed(2)}` : "Lost"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiceGame;
