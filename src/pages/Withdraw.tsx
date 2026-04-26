import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Smartphone, Bitcoin, Loader2, Lock, AlertTriangle, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type WithdrawTab = "mpesa" | "crypto" | "bank";

const presetAmountsKES = [500, 1000, 2500, 5000, 10000, 25000];
const WITHDRAWAL_FEE_RATE = 0.15;

const Withdraw = () => {
  const { user, profile, isLoggedIn, setShowAuthModal, refreshProfile, setShowDepositModal } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<WithdrawTab>("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState(500);
  const [processing, setProcessing] = useState(false);
  const [showFeeDialog, setShowFeeDialog] = useState(false);

  const feeAmount = Math.round(amount * WITHDRAWAL_FEE_RATE);
  const netReceive = amount - feeAmount;

  if (!isLoggedIn) {
    setShowAuthModal(true);
    return null;
  }

  const validateAndOpenFeeDialog = () => {
    if (!user || !profile) return;
    if (amount < 50) { toast.error("Minimum withdrawal is KES 50"); return; }
    if (amount > profile.balance) { toast.error("Insufficient balance"); return; }
    if (!phoneNumber || phoneNumber.length < 9) { toast.error("Enter valid M-Pesa number"); return; }
    setShowFeeDialog(true);
  };

  const handleMpesaWithdraw = async () => {
    if (!user || !profile) return;
    if (profile.balance < feeAmount) {
      toast.error("Insufficient balance to cover the 15% fee. Please deposit first.");
      return;
    }

    setProcessing(true);
    try {
      // Record transaction
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "withdrawal",
        method: "mpesa",
        amount,
        status: "processing",
        reference: phoneNumber,
      });
      if (txError) throw txError;

      // Deduct balance
      const newBalance = profile.balance - amount;
      await supabase.from("profiles").update({ balance: newBalance }).eq("user_id", user.id);
      await refreshProfile();

      toast.success("Withdrawal request submitted! You'll receive your M-Pesa within 24 hours.");
      setShowFeeDialog(false);
      navigate("/transactions");
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setProcessing(false);
    }
  };

  const tabs: { key: WithdrawTab; label: string; icon: any; active: boolean }[] = [
    { key: "mpesa", label: "M-Pesa", icon: Smartphone, active: true },
    { key: "crypto", label: "Crypto", icon: Bitcoin, active: false },
    { key: "bank", label: "Bank", icon: Lock, active: false },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display text-lg font-bold uppercase tracking-wider">Withdraw</h1>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Balance */}
        <div className="bg-card border border-border rounded-lg p-4 mb-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Balance</p>
          <p className="text-2xl font-bold text-primary mt-1">${profile?.balance.toFixed(2)}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => t.active ? setTab(t.key) : null}
              disabled={!t.active}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wider transition ${
                tab === t.key && t.active
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : t.active
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/40 cursor-not-allowed"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
              {!t.active && <span className="text-[9px] bg-muted px-1 rounded">Soon</span>}
            </button>
          ))}
        </div>

        {/* M-Pesa Withdraw */}
        {tab === "mpesa" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="0712345678"
                className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                Amount (KES)
              </label>
              <div className="relative mb-3">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">KES</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-secondary border border-border rounded-md pl-14 pr-4 py-3 text-lg font-bold text-foreground outline-none focus:border-primary transition"
                  min={50}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {presetAmountsKES.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    className={`py-2 rounded-md text-sm font-medium transition ${
                      amount === a ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                    }`}
                  >
                    KES {a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={validateAndOpenFeeDialog}
              disabled={processing || amount < 50 || !phoneNumber}
              className="w-full bg-accent text-accent-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                `Withdraw KES ${amount.toLocaleString()}`
              )}
            </button>
            <p className="text-[10px] text-muted-foreground text-center">
              Withdrawals are processed within 24 hours. Min: KES 50.
            </p>
          </div>
        )}

        {/* Coming Soon tabs */}
        {(tab === "crypto" || tab === "bank") && (
          <div className="text-center py-12">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold">Coming Soon</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === "crypto" ? "Crypto" : "Bank"} withdrawals will be available soon.
            </p>
          </div>
        )}
      </div>

      {/* Withdrawal Fee Confirmation Dialog */}
      <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-accent" />
            </div>
            <DialogTitle className="text-center font-display uppercase tracking-wider">
              Withdrawal Tax Fee Required
            </DialogTitle>
            <DialogDescription className="text-center">
              As per government policy, a <span className="font-bold text-accent">15% tax fee</span> applies to all withdrawals.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-secondary/50 border border-border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Withdrawal amount</span>
              <span className="font-bold">KES {amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Tax fee (15%)</span>
              <span className="font-bold">- KES {feeAmount.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-bold">You will receive</span>
              <span className="font-bold text-primary">KES {netReceive.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            The 15% fee will be deducted from your account balance. If your balance is insufficient, please deposit first.
          </p>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <button
              onClick={handleMpesaWithdraw}
              disabled={processing || (profile && profile.balance < amount + feeAmount)}
              className="w-full bg-accent text-accent-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                `Pay Fee & Withdraw`
              )}
            </button>
            <button
              onClick={() => { setShowFeeDialog(false); navigate("/deposit"); }}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" /> Deposit to Cover Fee
            </button>
            <button
              onClick={() => setShowFeeDialog(false)}
              className="w-full text-muted-foreground hover:text-foreground py-2 text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Withdraw;
