import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Bomb, Gem } from "lucide-react";

interface Props { play: (s: "bet"|"win"|"lose"|"click"|"cashout"|"tick"|"reveal"|"bomb") => void; }
const PRESET_STAKES = [10, 25, 50, 100, 250, 500];

const MinesGame = ({ play }: Props) => {
  const { isLoggedIn, profile, setShowAuthModal, deposit, withdraw } = useAuth();
  const [stake, setStake] = useState(50);
  const [mineCount, setMineCount] = useState(5);
  const [board, setBoard] = useState<("hidden"|"gem"|"mine")[]>(Array(25).fill("hidden"));
  const [mines, setMines] = useState<number[]>([]);
  const [playing, setPlaying] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const multiplier = useCallback(() => {
    if (revealed === 0) return 1;
    let m = 1;
    for (let i = 0; i < revealed; i++) {
      m *= (25 - mineCount - i) > 0 ? 25 / (25 - mineCount - i) : 1;
    }
    return Math.round(m * 100) / 100;
  }, [revealed, mineCount]);

  const startGame = async () => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    if (!profile || profile.balance < stake) { toast.error("Insufficient balance"); return; }
    const ok = await withdraw(stake);
    if (!ok) return;
    play("bet");
    const m: number[] = [];
    while (m.length < mineCount) {
      const r = Math.floor(Math.random() * 25);
      if (!m.includes(r)) m.push(r);
    }
    setMines(m);
    setBoard(Array(25).fill("hidden"));
    setRevealed(0);
    setPlaying(true);
    setGameOver(false);
  };

  const reveal = (i: number) => {
    if (!playing || gameOver || board[i] !== "hidden") return;
    const newBoard = [...board];
    if (mines.includes(i)) {
      play("bomb");
      mines.forEach(m => newBoard[m] = "mine");
      newBoard[i] = "mine";
      setBoard(newBoard);
      setGameOver(true);
      setPlaying(false);
      toast.error("BOOM! You hit a mine!");
    } else {
      play("reveal");
      newBoard[i] = "gem";
      setBoard(newBoard);
      setRevealed(prev => prev + 1);
    }
  };

  const cashOutMines = () => {
    if (!playing || gameOver || revealed === 0) return;
    const payout = Math.floor(stake * multiplier() * 100) / 100;
    deposit(payout);
    play("cashout");
    const newBoard = [...board];
    mines.forEach(m => { if (newBoard[m] === "hidden") newBoard[m] = "mine"; });
    setBoard(newBoard);
    setPlaying(false);
    setGameOver(true);
    toast.success(`Cashed out! Won $${payout.toFixed(2)} (${multiplier().toFixed(2)}x)`);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="bg-card border border-border rounded-xl p-3 flex-1 flex items-center justify-center">
        <div className="grid grid-cols-5 gap-1.5 w-full max-w-[320px]">
          {board.map((cell, i) => (
            <button key={i} onClick={() => reveal(i)} disabled={!playing || gameOver || cell !== "hidden"}
              className={`aspect-square rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-200
                ${cell === "hidden" ? "bg-secondary hover:bg-secondary/80 cursor-pointer" : ""}
                ${cell === "gem" ? "bg-primary/20 border-2 border-primary scale-95" : ""}
                ${cell === "mine" ? "bg-destructive/20 border-2 border-destructive scale-95" : ""}
              `}>
              {cell === "gem" && <Gem className="w-5 h-5 text-primary" />}
              {cell === "mine" && <Bomb className="w-5 h-5 text-destructive" />}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-3 shrink-0">
        {playing && revealed > 0 && (
          <div className="text-center mb-2">
            <span className="text-xs text-muted-foreground">Current: </span>
            <span className="font-bold text-primary">{multiplier().toFixed(2)}x (${(stake * multiplier()).toFixed(2)})</span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Stake</label>
            <div className="grid grid-cols-3 gap-1 mb-2">
              {PRESET_STAKES.map(a => (
                <button key={a} onClick={() => { setStake(a); play("click"); }} disabled={playing}
                  className={`py-1 rounded text-xs font-medium ${stake === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>${a}</button>
              ))}
            </div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Mines: {mineCount}</label>
            <input type="range" min={1} max={24} value={mineCount} onChange={e => setMineCount(Number(e.target.value))} disabled={playing} className="w-full accent-primary" />
          </div>
          <div className="flex flex-col justify-end gap-2">
            {!playing ? (
              <button onClick={startGame} className="w-full bg-primary text-primary-foreground py-3 rounded-md font-bold text-sm uppercase disabled:opacity-40">Start — ${stake}</button>
            ) : (
              <button onClick={cashOutMines} disabled={revealed === 0} className="w-full bg-accent text-accent-foreground py-3 rounded-md font-bold text-sm uppercase animate-pulse disabled:opacity-40 disabled:animate-none">
                Cash Out ${(stake * multiplier()).toFixed(2)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinesGame;
