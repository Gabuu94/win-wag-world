import { X, Trash2 } from "lucide-react";
import { useBetting } from "@/context/BettingContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const BettingSlip = () => {
  const { selections, removeSelection, clearAll, stake, setStake } = useBetting();
  const { isLoggedIn, profile, placeBet, setShowAuthModal, setShowDepositModal } = useAuth();

  const totalOdds = selections.length > 0
    ? selections.reduce((acc, b) => acc * b.odds, 1)
    : 0;

  const potentialWin = stake * totalOdds;

  const handlePlaceBet = async () => {
    if (selections.length === 0) {
      toast.error("Add selections to your bet slip first!");
      return;
    }
    if (!isLoggedIn) {
      toast.error("Please sign in to place bets");
      setShowAuthModal(true);
      return;
    }
    if (!profile || profile.balance < stake) {
      toast.error("Insufficient balance. Please deposit funds.");
      setShowDepositModal(true);
      return;
    }
    if (stake <= 0) {
      toast.error("Enter a valid stake amount");
      return;
    }

    const ok = await placeBet({
      selections: selections.map((s) => ({ matchLabel: s.matchLabel, pick: s.pick, odds: s.odds })),
      stake,
      totalOdds,
      potentialWin,
    });

    if (ok) {
      toast.success(
        `Bet placed! $${stake.toFixed(2)} on ${selections.length} selection(s) — Potential win: $${potentialWin.toFixed(2)}`
      );
      clearAll();
    } else {
      toast.error("Failed to place bet. Check your balance.");
    }
  };

  return (
    <aside className="hidden xl:flex flex-col w-72 bg-card border-l border-border h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider">Bet Slip</h3>
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {selections.length}
          </span>
          {selections.length > 0 && (
            <button onClick={clearAll} className="text-muted-foreground hover:text-destructive transition">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-border">
        {["Single", "Accumulator", "System"].map((tab, i) => (
          <button
            key={tab}
            className={`flex-1 py-2 text-xs font-medium transition ${
              (selections.length > 1 ? i === 1 : i === 0)
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {selections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-muted-foreground text-sm mb-1">No selections yet</p>
            <p className="text-muted-foreground/60 text-xs">Click on odds to add to your slip</p>
          </div>
        ) : (
          selections.map((bet) => (
            <div key={bet.id} className="bg-secondary rounded-md p-3 relative animate-in slide-in-from-right-2 duration-200">
              <button onClick={() => removeSelection(bet.id)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition">
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] text-muted-foreground mb-1">{bet.matchLabel}</p>
              <p className="text-sm font-medium mb-1">{bet.pick}</p>
              <span className="text-primary font-bold text-sm">{bet.odds.toFixed(2)}</span>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Odds</span>
          <span className="font-bold text-primary">{totalOdds > 0 ? totalOdds.toFixed(2) : "—"}</span>
        </div>

        <div className="flex items-center bg-secondary rounded-md overflow-hidden">
          <span className="text-xs text-muted-foreground px-3">$</span>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
            className="bg-transparent text-sm font-medium text-foreground py-2 outline-none w-full"
            min={0}
          />
        </div>

        {isLoggedIn && profile && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Balance</span>
            <span className="font-medium text-foreground">${profile.balance.toFixed(2)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Potential Win</span>
          <span className="font-bold text-accent">{potentialWin > 0 ? `$${potentialWin.toFixed(2)}` : "—"}</span>
        </div>

        <button
          onClick={handlePlaceBet}
          disabled={selections.length === 0}
          className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {!isLoggedIn ? "Sign In to Bet" : "Place Bet"}
        </button>
      </div>
    </aside>
  );
};

export default BettingSlip;
