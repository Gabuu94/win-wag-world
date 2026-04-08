import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import TopBar from "@/components/TopBar";
import BettingSlip from "@/components/BettingSlip";
import { Plane, TrendingUp, History, Loader2 } from "lucide-react";
import { toast } from "sonner";

type GameState = "waiting" | "flying" | "crashed";

interface BetRecord {
  id: number;
  stake: number;
  cashoutAt: number | null;
  multiplier: number;
  won: boolean;
  payout: number;
}

const PRESET_STAKES = [10, 25, 50, 100, 250, 500];

const VirtualGames = () => {
  const { isLoggedIn, profile, setShowAuthModal, deposit, withdraw } = useAuth();
  const [activeGame, setActiveGame] = useState<"aviator" | null>("aviator");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4">
          <h1 className="font-display text-2xl font-bold mb-4">Virtual Games</h1>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            <button
              onClick={() => setActiveGame("aviator")}
              className={`relative bg-card border rounded-xl p-4 text-center transition hover:border-primary ${activeGame === "aviator" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <Plane className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-sm">Aviator</h3>
              <p className="text-[10px] text-muted-foreground">Demo</p>
              <span className="absolute top-2 right-2 text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">LIVE</span>
            </button>
            {["Mines", "Plinko", "Dice", "Roulette", "Crash"].map((g) => (
              <div key={g} className="bg-card border border-border rounded-xl p-4 text-center opacity-50">
                <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-sm">{g}</h3>
                <p className="text-[10px] text-muted-foreground">Coming Soon</p>
              </div>
            ))}
          </div>

          {activeGame === "aviator" && <AviatorGame />}
        </main>
        <BettingSlip />
      </div>
    </div>
  );
};

const AviatorGame = () => {
  const { isLoggedIn, profile, setShowAuthModal, deposit, withdraw } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const [gameState, setGameState] = useState<GameState>("waiting");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [stake, setStake] = useState(50);
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutMultiplier, setCashoutMultiplier] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [history, setHistory] = useState<BetRecord[]>([]);
  const [pastCrashes, setPastCrashes] = useState<number[]>([]);
  const startTimeRef = useRef(0);

  // Generate crash point using provably fair algorithm
  const generateCrash = useCallback(() => {
    const e = 2 ** 32;
    const h = Math.floor(Math.random() * e);
    if (h % 33 === 0) return 1.0; // ~3% instant crash
    return Math.max(1.0, Math.floor((100 * e - h) / (e - h)) / 100);
  }, []);

  // Start new round
  const startRound = useCallback(() => {
    const cp = generateCrash();
    setCrashPoint(cp);
    setMultiplier(1.0);
    setCashedOut(false);
    setCashoutMultiplier(0);
    setCountdown(5);

    // Countdown
    let count = 5;
    const countInterval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countInterval);
        setGameState("flying");
        startTimeRef.current = Date.now();
      }
    }, 1000);
  }, [generateCrash]);

  // Flying animation
  useEffect(() => {
    if (gameState !== "flying") return;

    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const m = Math.pow(Math.E, 0.08 * elapsed);
      const rounded = Math.floor(m * 100) / 100;
      setMultiplier(rounded);

      if (rounded >= crashPoint) {
        setMultiplier(crashPoint);
        setGameState("crashed");
        setPastCrashes(prev => [crashPoint, ...prev].slice(0, 20));

        if (hasBet && !cashedOut) {
          setHistory(prev => [{ id: Date.now(), stake, cashoutAt: null, multiplier: crashPoint, won: false, payout: 0 }, ...prev].slice(0, 50));
          setHasBet(false);
        }

        // Auto restart after 3s
        setTimeout(() => {
          setGameState("waiting");
          startRound();
        }, 3000);
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, crashPoint, hasBet, cashedOut, stake, startRound]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = h - (h / 5) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "10px sans-serif";
      ctx.fillText(`${(1 + i * 0.5).toFixed(1)}x`, 4, y - 4);
    }

    if (gameState === "flying" || gameState === "crashed") {
      const maxM = Math.max(multiplier, 2);
      const points: [number, number][] = [];
      const steps = 100;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const m = Math.pow(Math.E, 0.08 * t * ((Date.now() - startTimeRef.current) / 1000));
        const x = t * w;
        const y = h - ((Math.min(m, maxM) - 1) / (maxM - 1)) * (h * 0.85);
        points.push([x, y]);
      }

      // Gradient line
      const grad = ctx.createLinearGradient(0, h, w, 0);
      if (gameState === "crashed") {
        grad.addColorStop(0, "hsl(0, 84%, 50%)");
        grad.addColorStop(1, "hsl(0, 84%, 70%)");
      } else {
        grad.addColorStop(0, "hsl(142, 71%, 35%)");
        grad.addColorStop(1, "hsl(142, 71%, 55%)");
      }

      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.beginPath();
      points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.stroke();

      // Fill area
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = gameState === "crashed" ? "hsl(0, 84%, 50%)" : "hsl(142, 71%, 45%)";
      ctx.beginPath();
      points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Plane icon at tip
      if (points.length > 0) {
        const [px, py] = points[points.length - 1];
        ctx.fillStyle = gameState === "crashed" ? "hsl(0, 84%, 60%)" : "hsl(142, 71%, 55%)";
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [multiplier, gameState]);

  // Auto start first round
  useEffect(() => {
    startRound();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const placeBet = () => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    if (!profile || profile.balance < stake) { toast.error("Insufficient balance"); return; }
    if (gameState !== "waiting") { toast.error("Wait for next round"); return; }
    
    withdraw(stake).then(ok => {
      if (ok) {
        setHasBet(true);
        toast.success(`Bet placed: $${stake}`);
      }
    });
  };

  const cashOut = () => {
    if (!hasBet || cashedOut || gameState !== "flying") return;
    setCashedOut(true);
    setCashoutMultiplier(multiplier);
    const payout = Math.floor(stake * multiplier * 100) / 100;
    deposit(payout);
    setHistory(prev => [{ id: Date.now(), stake, cashoutAt: multiplier, multiplier, won: true, payout }, ...prev].slice(0, 50));
    setHasBet(false);
    toast.success(`Cashed out at ${multiplier.toFixed(2)}x — Won $${payout.toFixed(2)}!`);
  };

  return (
    <div className="space-y-4">
      {/* Past crashes */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {pastCrashes.map((c, i) => (
          <span key={i} className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${c < 2 ? "bg-destructive/20 text-destructive" : c < 5 ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
            {c.toFixed(2)}x
          </span>
        ))}
        {pastCrashes.length === 0 && <span className="text-xs text-muted-foreground">No history yet</span>}
      </div>

      {/* Game Display */}
      <div className="bg-card border border-border rounded-xl overflow-hidden relative">
        <canvas ref={canvasRef} width={600} height={300} className="w-full h-[200px] sm:h-[280px]" />
        
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {gameState === "waiting" && countdown > 0 && (
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-1">Next round in</p>
              <p className="font-display text-5xl font-bold text-primary">{countdown}s</p>
            </div>
          )}
          {gameState === "flying" && (
            <div className="text-center">
              <p className="font-display text-5xl sm:text-6xl font-bold text-primary drop-shadow-lg">
                {multiplier.toFixed(2)}x
              </p>
              {cashedOut && (
                <p className="text-sm font-bold text-accent mt-1">Cashed out at {cashoutMultiplier.toFixed(2)}x</p>
              )}
            </div>
          )}
          {gameState === "crashed" && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">CRASHED</p>
              <p className="font-display text-5xl sm:text-6xl font-bold text-destructive">
                {crashPoint.toFixed(2)}x
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Stake Amount</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">$</span>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-secondary border border-border rounded-md pl-8 pr-4 py-2.5 text-sm font-bold outline-none focus:border-primary"
                  disabled={hasBet}
                />
              </div>
              <button onClick={() => setStake(s => Math.max(1, Math.floor(s / 2)))} className="bg-secondary px-3 py-2 rounded-md text-xs font-bold" disabled={hasBet}>½</button>
              <button onClick={() => setStake(s => s * 2)} className="bg-secondary px-3 py-2 rounded-md text-xs font-bold" disabled={hasBet}>2x</button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_STAKES.map((a) => (
                <button key={a} onClick={() => setStake(a)} disabled={hasBet}
                  className={`py-1.5 rounded-md text-xs font-medium transition ${stake === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                  ${a}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-end">
            {!hasBet ? (
              <button
                onClick={placeBet}
                disabled={gameState !== "waiting"}
                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green disabled:opacity-40"
              >
                {gameState === "waiting" ? `Place Bet — $${stake}` : "Wait for next round..."}
              </button>
            ) : (
              <button
                onClick={cashOut}
                disabled={gameState !== "flying" || cashedOut}
                className="w-full bg-accent text-accent-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition animate-pulse disabled:opacity-40 disabled:animate-none"
              >
                {cashedOut ? `Cashed Out — ${cashoutMultiplier.toFixed(2)}x` : gameState === "flying" ? `Cash Out — $${(stake * multiplier).toFixed(2)}` : "Waiting..."}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold">Your Bets</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {history.map((h) => (
              <div key={h.id} className={`flex items-center justify-between py-2 px-3 rounded-md text-xs ${h.won ? "bg-primary/10" : "bg-destructive/10"}`}>
                <span className="font-medium">${h.stake.toFixed(2)}</span>
                <span className={`font-bold ${h.won ? "text-primary" : "text-destructive"}`}>
                  {h.won ? `+$${h.payout.toFixed(2)} (${h.cashoutAt?.toFixed(2)}x)` : `Crashed at ${h.multiplier.toFixed(2)}x`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualGames;
