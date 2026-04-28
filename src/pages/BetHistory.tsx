import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatMoney } from "@/lib/currency";
import TopBar from "@/components/TopBar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BetRow {
  id: string;
  selections: { matchLabel: string; pick: string; odds: number; status?: string }[];
  stake: number;
  total_odds: number;
  potential_win: number;
  status: string;
  placed_at: string;
}

const BetHistory = () => {
  const { user, isLoggedIn, setShowAuthModal, profile } = useAuth();
  const navigate = useNavigate();
  const [bets, setBets] = useState<BetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchBets = async () => {
      const { data } = await supabase
        .from("bets")
        .select("*")
        .eq("user_id", user.id)
        .order("placed_at", { ascending: false });
      if (data) {
        setBets(data.map((b: any) => ({ ...b, selections: b.selections as any })));
      }
      setLoading(false);
    };
    fetchBets();
  }, [user]);

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

        <h2 className="font-display text-2xl font-bold uppercase tracking-wider mb-4">Bet History</h2>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : bets.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No bets placed yet.</p>
            <button onClick={() => navigate("/")} className="text-primary text-sm hover:underline mt-2">
              Browse matches →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => (
              <div key={bet.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                      bet.status === "pending"
                        ? "bg-accent/20 text-accent"
                        : bet.status === "won"
                        ? "bg-primary/20 text-primary"
                        : "bg-destructive/20 text-destructive"
                    }`}>
                      {bet.status}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded uppercase tracking-wider">
                      ID: {bet.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(bet.placed_at).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  {bet.selections.map((sel, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{sel.matchLabel}</p>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          {sel.pick}
                          {sel.status === "won" && <span className="text-[10px] font-bold text-primary uppercase">✓ Won</span>}
                          {sel.status === "lost" && <span className="text-[10px] font-bold text-destructive uppercase">✗ Lost</span>}
                          {!sel.status && bet.status === "pending" && <span className="text-[10px] font-bold text-muted-foreground uppercase">• Pending</span>}
                        </p>
                      </div>
                      <span className={`font-bold text-sm ${
                        sel.status === "won" ? "text-primary" : sel.status === "lost" ? "text-destructive line-through" : "text-primary"
                      }`}>{sel.odds.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border text-sm">
                  <div>
                    <span className="text-muted-foreground">Stake: </span>
                    <span className="font-medium">{formatMoney(bet.stake, profile)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      {bet.status === "won" ? "Won: " : bet.status === "lost" ? "Lost: " : "Potential Win: "}
                    </span>
                    <span className={`font-bold ${
                      bet.status === "won" ? "text-primary" : bet.status === "lost" ? "text-destructive" : "text-accent"
                    }`}>{formatMoney(bet.potential_win, profile)}</span>
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
