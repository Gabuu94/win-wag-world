import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";

interface Props { play: (s: "bet"|"win"|"lose"|"click"|"cashout"|"tick"|"reveal"|"bomb") => void; }
const PRESET_STAKES = [10, 25, 50, 100, 250, 500];
const ROWS = 8;
const MULTIPLIERS = [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6];

const PlinkoGame = ({ play }: Props) => {
  const { isLoggedIn, profile, setShowAuthModal, deposit, withdraw } = useAuth();
  const { isAdmin } = useAdmin();
  const [stake, setStake] = useState(50);
  const [dropping, setDropping] = useState(false);
  const [ballPath, setBallPath] = useState<number[]>([]);
  const [landedSlot, setLandedSlot] = useState<number | null>(null);
  const [animStep, setAnimStep] = useState(-1);
  const [history, setHistory] = useState<{ slot: number; mult: number; payout: number }[]>([]);

  const drop = async () => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    if (!profile || profile.balance < stake) { toast.error("Insufficient balance"); return; }
    if (dropping) return;
    const ok = await withdraw(stake);
    if (!ok) return;
    play("bet");
    setDropping(true);
    setLandedSlot(null);
    setAnimStep(-1);

    // Generate path
    const path: number[] = [4]; // start center
    let pos = 4;
    for (let r = 0; r < ROWS; r++) {
      pos += Math.random() > 0.5 ? 0.5 : -0.5;
      pos = Math.max(0, Math.min(ROWS, pos));
      path.push(pos);
    }
    setBallPath(path);

    // Animate
    for (let i = 0; i <= ROWS; i++) {
      await new Promise(r => setTimeout(r, 200));
      setAnimStep(i);
      play("tick");
    }

    const slot = Math.round(path[path.length - 1]);
    const clampedSlot = Math.max(0, Math.min(MULTIPLIERS.length - 1, slot));
    setLandedSlot(clampedSlot);
    const mult = MULTIPLIERS[clampedSlot];
    const payout = Math.floor(stake * mult * 100) / 100;
    
    if (mult >= 1) {
      deposit(payout);
      play("win");
      toast.success(`Landed on ${mult}x — Won $${payout.toFixed(2)}!`);
    } else {
      deposit(payout);
      play("lose");
      toast.error(`Landed on ${mult}x — Returned $${payout.toFixed(2)}`);
    }
    setHistory(prev => [{ slot: clampedSlot, mult, payout }, ...prev].slice(0, 20));
    setDropping(false);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="bg-card border border-border rounded-xl p-4 flex-1 flex flex-col items-center justify-center">
        {/* Peg board */}
        <div className="relative w-full max-w-[300px]">
          {Array.from({ length: ROWS }).map((_, row) => (
            <div key={row} className="flex justify-center gap-3 mb-2">
              {Array.from({ length: row + 3 }).map((_, col) => (
                <div key={col} className="w-2 h-2 rounded-full bg-muted-foreground/40" />
              ))}
            </div>
          ))}
          {/* Ball */}
          {animStep >= 0 && ballPath[animStep] !== undefined && (
            <div className="absolute w-4 h-4 rounded-full bg-primary shadow-lg transition-all duration-200"
              style={{
                top: `${(animStep / ROWS) * 80}%`,
                left: `${(ballPath[animStep] / ROWS) * 80 + 10}%`,
                transform: "translate(-50%, -50%)"
              }} />
          )}
        </div>

        {/* Multiplier slots */}
        <div className="flex gap-1 mt-4 w-full max-w-[300px]">
          {MULTIPLIERS.map((m, i) => (
            <div key={i} className={`flex-1 py-2 rounded text-center text-xs font-bold transition-all
              ${landedSlot === i ? "bg-primary text-primary-foreground scale-110" : m >= 2 ? "bg-primary/20 text-primary" : m >= 1 ? "bg-secondary text-muted-foreground" : "bg-destructive/20 text-destructive"}`}>
              {m}x
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="grid grid-cols-3 gap-1">
            {PRESET_STAKES.map(a => (
              <button key={a} onClick={() => { setStake(a); play("click"); }} disabled={dropping}
                className={`py-1.5 rounded text-xs font-medium ${stake === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>${a}</button>
            ))}
          </div>
          <button onClick={drop} disabled={dropping}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md font-bold text-sm uppercase disabled:opacity-40">
            {dropping ? "Dropping..." : `Drop — $${stake}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlinkoGame;
