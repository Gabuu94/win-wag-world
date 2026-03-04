import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import TopBar from "@/components/TopBar";

const BetHistory = () => {
  const { user, isLoggedIn, setShowAuthModal } = useAuth();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to view your bet history.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold text-sm hover:brightness-110 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to matches
        </button>

        <h2 className="font-display text-2xl font-bold uppercase tracking-wider mb-4">
          Bet History
        </h2>

        {user!.betHistory.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No bets placed yet.</p>
            <button
              onClick={() => navigate("/")}
              className="text-primary text-sm hover:underline mt-2"
            >
              Browse matches →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {user!.betHistory.map((bet) => (
              <div key={bet.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    bet.status === "pending"
                      ? "bg-accent/20 text-accent"
                      : bet.status === "won"
                      ? "bg-primary/20 text-primary"
                      : "bg-destructive/20 text-destructive"
                  }`}>
                    {bet.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(bet.placedAt).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  {bet.selections.map((sel, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{sel.matchLabel}</p>
                        <p className="text-sm font-medium">{sel.pick}</p>
                      </div>
                      <span className="text-primary font-bold text-sm">{sel.odds.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                  <div>
                    <span className="text-muted-foreground">Stake: </span>
                    <span className="font-medium">${bet.stake.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Potential Win: </span>
                    <span className="font-bold text-accent">${bet.potentialWin.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BetHistory;
