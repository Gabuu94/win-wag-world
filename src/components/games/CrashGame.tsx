import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";

interface Props { play: (s: "bet"|"win"|"lose"|"click"|"cashout"|"tick"|"reveal"|"bomb") => void; }
const PRESET_STAKES = [10, 25, 50, 100, 250, 500];

type State = "betting" | "running" | "crashed";

const CrashGame = ({ play }: Props) => {
  const { isLoggedIn, profile, setShowAuthModal, deposit, withdraw } = useAuth();
  const [stake, setStake] = useState(50);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [state, setState] = useState<State>("betting");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const startRef = useRef(0);
  const animRef = useRef(0);

  const genCrash = useCallback(() => {
    const e = 2 ** 32;
    const h = Math.floor(Math.random() * e);
    if (h % 33 === 0) return 1.0;
    return Math.max(1.0, Math.floor((100 * e - h) / (e - h)) / 100);
  }, []);

  const startRound = useCallback(() => {
    const cp = genCrash();
    setCrashPoint(cp);
    setMultiplier(1.0);
    setCashedOut(false);
    setState("betting");
    setTimeout(() => {
      setState("running");
      startRef.current = Date.now();
    }, 3000);
  }, [genCrash]);

  useEffect(() => {
    if (state !== "running") return;
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const m = Math.floor(Math.pow(Math.E, 0.06 * elapsed) * 100) / 100;
      setMultiplier(m);

      if (hasBet && !cashedOut && m >= autoCashout) {
        setCashedOut(true);
        const payout = Math.floor(stake * autoCashout * 100) / 100;
        deposit(payout);
        play("cashout");
        setHasBet(false);
        toast.success(`Auto cashed out at ${autoCashout}x — $${payout.toFixed(2)}`);
      }

      if (m >= crashPoint) {
        setMultiplier(crashPoint);
        setState("crashed");
        play("lose");
        setHistory(prev => [crashPoint, ...prev].slice(0, 20));
        if (hasBet && !cashedOut) setHasBet(false);
        setTimeout(startRound, 3000);
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [state, crashPoint, hasBet, cashedOut, autoCashout, stake, startRound, play, deposit]);

  useEffect(() => { startRound(); return () => cancelAnimationFrame(animRef.current); }, []);

  const placeBet = async () => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    if (!profile || profile.balance < stake) { toast.error("Insufficient balance"); return; }
    if (state !== "betting") { toast.error("Wait for next round"); return; }
    const ok = await withdraw(stake);
    if (!ok) return;
    play("bet");
    setHasBet(true);
    setCashedOut(false);
  };

  const cashOut = () => {
    if (!hasBet || cashedOut || state !== "running") return;
    setCashedOut(true);
    const payout = Math.floor(stake * multiplier * 100) / 100;
    deposit(payout);
    play("cashout");
    setHasBet(false);
    toast.success(`Cashed out at ${multiplier.toFixed(2)}x — $${payout.toFixed(2)}`);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
        {history.map((c, i) => (
          <span key={i} className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${c < 2 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>{c.toFixed(2)}x</span>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl flex-1 flex items-center justify-center relative min-h-[180px]">
        <TrendingUp className={`absolute top-4 left-4 w-8 h-8 ${state === "crashed" ? "text-destructive" : "text-primary"} opacity-20`} />
        <div className="text-center">
          {state === "betting" && <p className="font-display text-4xl font-bold text-muted-foreground">Starting...</p>}
          {state === "running" && <p className="font-display text-6xl font-bold text-primary">{multiplier.toFixed(2)}x</p>}
          {state === "crashed" && (
            <>
              <p className="text-sm text-muted-foreground">CRASHED</p>
              <p className="font-display text-6xl font-bold text-destructive">{crashPoint.toFixed(2)}x</p>
            </>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="grid grid-cols-3 gap-1 mb-2">
              {PRESET_STAKES.map(a => (
                <button key={a} onClick={() => { setStake(a); play("click"); }} disabled={hasBet}
                  className={`py-1 rounded text-xs font-medium ${stake === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>${a}</button>
              ))}
            </div>
            <label className="text-xs text-muted-foreground block mb-1">Auto Cashout</label>
            <input type="number" step={0.1} min={1.1} value={autoCashout} onChange={e => setAutoCashout(Number(e.target.value))}
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm font-bold outline-none focus:border-primary" disabled={hasBet} />
          </div>
          <div className="flex flex-col justify-end">
            {!hasBet ? (
              <button onClick={placeBet} disabled={state !== "betting"}
                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-bold text-sm uppercase disabled:opacity-40">
                {state === "betting" ? `Bet — $${stake}` : "Wait..."}
              </button>
            ) : (
              <button onClick={cashOut} disabled={state !== "running" || cashedOut}
                className="w-full bg-accent text-accent-foreground py-3 rounded-md font-bold text-sm uppercase animate-pulse disabled:opacity-40 disabled:animate-none">
                {cashedOut ? "Cashed Out" : `Cash Out $${(stake * multiplier).toFixed(2)}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrashGame;
