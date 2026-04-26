import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { formatMoney } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: string;
  type: string;
  method: string;
  amount: number;
  status: string;
  reference: string | null;
  created_at: string;
}

const TransactionHistory = () => {
  const { user, isLoggedIn, setShowAuthModal, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    fetchTransactions();

    // Realtime subscription
    const channel = supabase
      .channel("transactions-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "transactions",
        filter: `user_id=eq.${user?.id}`,
      }, () => { fetchTransactions(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isLoggedIn]);

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setTransactions(data as Transaction[]);
    setLoading(false);
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "text-primary bg-primary/10";
      case "pending": case "processing": return "text-yellow-400 bg-yellow-400/10";
      case "failed": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold uppercase tracking-wider">Transaction History</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No transactions yet</p>
            <p className="text-sm mt-1">Your deposits and withdrawals will appear here</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === "deposit" ? "bg-primary/10" : "bg-accent/10"
              }`}>
                {tx.type === "deposit" ? (
                  <ArrowDownLeft className="w-5 h-5 text-primary" />
                ) : (
                  <ArrowUpRight className="w-5 h-5 text-accent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm capitalize">{tx.type}</p>
                  <span className="text-xs text-muted-foreground uppercase">{tx.method}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(tx.created_at).toLocaleString()}
                </p>
                {tx.reference && (
                  <p className="text-[10px] text-muted-foreground truncate">{tx.reference}</p>
                )}
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${tx.type === "deposit" ? "text-primary" : "text-accent"}`}>
                  {tx.type === "deposit" ? "+" : "-"}{formatMoney(tx.amount, profile)}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${statusColor(tx.status)}`}>
                  {tx.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
