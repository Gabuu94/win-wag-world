import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ticket, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { toast } from "sonner";

const Voucher = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, setShowAuthModal, refreshProfile } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) { toast.error("Please enter a voucher code"); return; }
    if (!user) { setShowAuthModal(true); return; }

    setLoading(true);
    setResult(null);

    const { data, error } = await supabase.rpc("redeem_voucher", { p_user_id: user.id, p_code: code.trim() });

    setLoading(false);

    if (error) {
      setResult({ success: false, message: error.message });
      return;
    }

    const row = (data as any[])?.[0];
    if (row) {
      setResult({ success: row.success, message: row.message });
      if (row.success) {
        await refreshProfile();
        setCode("");
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Ticket className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">Sign in to redeem vouchers</p>
            <button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold text-sm">Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-primary" /> Redeem Voucher
        </h1>

        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-4">Enter your voucher code below to claim your bonus.</p>

          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null); }}
            placeholder="Enter voucher code"
            className="w-full bg-background border border-border rounded-md px-4 py-3 text-center text-lg font-mono font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
            maxLength={20}
          />

          <button
            onClick={handleRedeem}
            disabled={loading || !code.trim()}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md font-bold text-sm hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
            Redeem Voucher
          </button>

          {result && (
            <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm ${result.success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {result.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {result.message}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Voucher;
