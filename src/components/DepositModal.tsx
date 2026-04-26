import { useEffect, useRef, useState } from "react";
import { X, Smartphone, Bitcoin, Copy, Check, Loader2, CreditCard, Landmark, Lock, Wallet, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isKenyan, formatMoney } from "@/lib/currency";

type PaymentTab = "mpesa" | "crypto" | "card" | "bank" | "airtel" | "paypal";

const cryptoCurrencies = [
  { id: "btc", label: "Bitcoin", symbol: "BTC" },
  { id: "eth", label: "Ethereum", symbol: "ETH" },
  { id: "usdttrc20", label: "USDT (TRC20)", symbol: "USDT" },
  { id: "ltc", label: "Litecoin", symbol: "LTC" },
];

const presetAmountsKES = [100, 250, 500, 1000, 2500, 5000];
const presetAmountsUSD = [5, 10, 25, 50, 100, 250];

const STK_TIMEOUT_SECONDS = 90;

const buildTabs = (mpesaActive: boolean): { key: PaymentTab; label: string; icon: any; active: boolean }[] => [
  { key: "mpesa", label: "M-Pesa", icon: Smartphone, active: mpesaActive },
  { key: "crypto", label: "Crypto", icon: Bitcoin, active: true },
  { key: "airtel", label: "Airtel", icon: Smartphone, active: false },
  { key: "card", label: "Card", icon: CreditCard, active: false },
  { key: "bank", label: "Bank", icon: Landmark, active: false },
  { key: "paypal", label: "PayPal", icon: Wallet, active: false },
];

type DepositPhase =
  | { kind: "form" }
  | { kind: "stk-sent"; amount: number; phone: string }
  | { kind: "crypto-pending"; pay_address: string; pay_amount: number; pay_currency: string; amount_usd: number }
  | { kind: "success"; amount: number; method: "mpesa" | "crypto" }
  | { kind: "failed"; method: "mpesa" | "crypto"; reason?: string };

// Live 3-step progress indicator. State derived from the current deposit phase.
type ProgressStatus = "done" | "active" | "pending" | "failed";
const DepositProgress = ({
  phase,
  method,
}: {
  phase: DepositPhase;
  method: "mpesa" | "crypto";
}) => {
  const labels = method === "mpesa"
    ? ["STK Sent", "Awaiting PIN", "Funds Credited"]
    : ["Address Issued", "Awaiting Transfer", "Funds Credited"];

  let statuses: ProgressStatus[] = ["pending", "pending", "pending"];
  if (phase.kind === "stk-sent" || phase.kind === "crypto-pending") {
    statuses = ["done", "active", "pending"];
  } else if (phase.kind === "success") {
    statuses = ["done", "done", "done"];
  } else if (phase.kind === "failed") {
    statuses = ["done", "failed", "pending"];
  }

  const statusLabel =
    phase.kind === "success" ? "Completed" :
    phase.kind === "failed" ? "Failed" :
    "Pending";
  const statusColor =
    phase.kind === "success" ? "bg-primary/15 text-primary border-primary/30" :
    phase.kind === "failed" ? "bg-destructive/15 text-destructive border-destructive/30" :
    "bg-accent/15 text-accent border-accent/30";

  return (
    <div className="bg-secondary/50 border border-border rounded-md p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Deposit Progress</span>
        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center">
        {statuses.map((s, i) => (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors ${
                  s === "done"
                    ? "bg-primary border-primary text-primary-foreground"
                    : s === "active"
                    ? "bg-accent/20 border-accent text-accent"
                    : s === "failed"
                    ? "bg-destructive/20 border-destructive text-destructive"
                    : "bg-secondary border-border text-muted-foreground"
                }`}
              >
                {s === "done" ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : s === "failed" ? (
                  <X className="w-3.5 h-3.5" strokeWidth={3} />
                ) : s === "active" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[9px] uppercase tracking-wider text-center leading-tight w-16 ${
                  s === "done" || s === "active"
                    ? "text-foreground font-bold"
                    : s === "failed"
                    ? "text-destructive font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {labels[i]}
              </span>
            </div>
            {/* Connector */}
            {i < statuses.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 -mt-5 rounded overflow-hidden bg-border relative">
                <div
                  className={`h-full transition-all duration-500 ${
                    statuses[i] === "done" && statuses[i + 1] !== "pending"
                      ? statuses[i + 1] === "failed"
                        ? "bg-destructive w-full"
                        : "bg-primary w-full"
                      : statuses[i] === "done"
                      ? "bg-primary w-1/2"
                      : "w-0"
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const DepositModal = () => {
  const { showDepositModal, setShowDepositModal, isLoggedIn, setShowAuthModal, user, refreshProfile, profile } = useAuth();
  const ke = isKenyan(profile);
  const [tab, setTab] = useState<PaymentTab>(ke ? "mpesa" : "crypto");

  // If profile loads/changes (e.g. user switches country), and they aren't Kenyan,
  // force away from the M-Pesa tab to crypto.
  useEffect(() => {
    if (!ke && tab === "mpesa") setTab("crypto");
  }, [ke, tab]);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [mpesaAmount, setMpesaAmount] = useState(500);
  const [mpesaProcessing, setMpesaProcessing] = useState(false);

  const [cryptoAmount, setCryptoAmount] = useState(25);
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [cryptoProcessing, setCryptoProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [phase, setPhase] = useState<DepositPhase>({ kind: "form" });
  const [stkRemaining, setStkRemaining] = useState(STK_TIMEOUT_SECONDS);

  // Track the current pending transaction so we can listen for confirmation
  const pendingTxRef = useRef<string | null>(null);

  // Realtime listener for transaction status changes (success/fail signals)
  useEffect(() => {
    if (!user || !showDepositModal) return;
    const channel = supabase
      .channel(`deposit-tx-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row: any = payload.new;
          if (!row || row.type !== "deposit") return;
          if (pendingTxRef.current && row.id !== pendingTxRef.current) return;

          if (row.status === "completed") {
            const method = row.method === "mpesa" ? "mpesa" : "crypto";
            setPhase({ kind: "success", amount: Number(row.amount) || 0, method });
            refreshProfile();
            pendingTxRef.current = null;
          } else if (row.status === "failed" || row.status === "cancelled") {
            const method = row.method === "mpesa" ? "mpesa" : "crypto";
            setPhase({ kind: "failed", method, reason: row.metadata?.reason });
            pendingTxRef.current = null;
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showDepositModal, refreshProfile]);

  // Countdown for the STK push wait screen
  useEffect(() => {
    if (phase.kind !== "stk-sent") return;
    setStkRemaining(STK_TIMEOUT_SECONDS);
    const interval = setInterval(() => {
      setStkRemaining((s) => {
        if (s <= 1) {
          clearInterval(interval);
          // Timed out — gently surface a message but keep waiting in case of late callback
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase.kind]);

  // Periodic profile refresh while waiting (covers cases where realtime is delayed)
  useEffect(() => {
    if (phase.kind !== "stk-sent" && phase.kind !== "crypto-pending") return;
    const interval = setInterval(() => {
      refreshProfile();
    }, 5000);
    return () => clearInterval(interval);
  }, [phase.kind, refreshProfile]);

  if (!showDepositModal) return null;

  const resetToForm = () => {
    setPhase({ kind: "form" });
    pendingTxRef.current = null;
  };

  const handleClose = () => {
    setShowDepositModal(false);
    resetToForm();
  };

  const handleMpesaDeposit = async () => {
    if (!isLoggedIn || !user) { setShowDepositModal(false); setShowAuthModal(true); return; }
    if (!ke) {
      toast.error("M-Pesa is only available for Kenyan accounts. Please use Crypto instead.");
      setTab("crypto");
      return;
    }
    if (mpesaAmount < 10) { toast.error("Minimum deposit is KES 10"); return; }
    if (!phoneNumber || phoneNumber.length < 9) { toast.error("Enter a valid M-Pesa phone number"); return; }

    setMpesaProcessing(true);
    try {
      // Record pending transaction
      const { data: tx } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        method: "mpesa",
        amount: mpesaAmount,
        status: "pending",
        reference: phoneNumber,
      }).select("id").single();
      pendingTxRef.current = tx?.id ?? null;

      const { data, error } = await supabase.functions.invoke("mpesa-deposit", {
        body: { phone_number: phoneNumber, amount: mpesaAmount, user_id: user.id },
      });

      if (error) throw error;
      if (data?.success) {
        setPhase({ kind: "stk-sent", amount: mpesaAmount, phone: phoneNumber });
      } else {
        toast.error(data?.error || "Failed to initiate M-Pesa payment");
      }
    } catch (err: any) {
      toast.error(err.message || "M-Pesa deposit failed");
    } finally {
      setMpesaProcessing(false);
    }
  };

  const handleCryptoDeposit = async () => {
    if (!isLoggedIn || !user) { setShowDepositModal(false); setShowAuthModal(true); return; }
    if (cryptoAmount < 5) { toast.error("Minimum deposit is $5"); return; }

    setCryptoProcessing(true);
    try {
      const { data: tx } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        method: "crypto",
        amount: cryptoAmount,
        status: "pending",
        reference: selectedCrypto,
      }).select("id").single();
      pendingTxRef.current = tx?.id ?? null;

      const { data, error } = await supabase.functions.invoke("crypto-deposit", {
        body: { amount_usd: cryptoAmount, currency: selectedCrypto, user_id: user.id },
      });

      if (error) throw error;
      if (data?.success) {
        setPhase({
          kind: "crypto-pending",
          pay_address: data.pay_address,
          pay_amount: data.pay_amount,
          pay_currency: data.pay_currency,
          amount_usd: cryptoAmount,
        });
      } else {
        toast.error(data?.error || "Failed to create crypto payment");
      }
    } catch (err: any) {
      toast.error(err.message || "Crypto deposit failed");
    } finally {
      setCryptoProcessing(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isOverlayPhase =
    phase.kind === "stk-sent" ||
    phase.kind === "crypto-pending" ||
    phase.kind === "success" ||
    phase.kind === "failed";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-xl font-bold uppercase tracking-wider">
            {phase.kind === "success" ? "Deposit Complete" :
             phase.kind === "failed" ? "Deposit Failed" :
             phase.kind === "stk-sent" ? "Confirm on Your Phone" :
             phase.kind === "crypto-pending" ? "Send Payment" :
             "Deposit Funds"}
          </h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs only visible in form phase */}
        {!isOverlayPhase && (
          <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-border overflow-x-auto">
            {buildTabs(ke).map((t) => (
              <button
                key={t.key}
                onClick={() => t.active ? setTab(t.key) : null}
                disabled={!t.active}
                className={`flex flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wider transition relative ${
                  tab === t.key && t.active
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : t.active
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-muted-foreground/40 cursor-not-allowed"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {!t.active && (
                  <span className="absolute top-1 right-1 text-[7px] bg-muted text-muted-foreground px-1 rounded">Soon</span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* ============================== FORM PHASE ============================== */}
          {phase.kind === "form" && tab === "mpesa" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Phone Number</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="0712345678 or 254712345678"
                  className="w-full bg-secondary border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Amount (KES)</label>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">KES</span>
                  <input type="number" value={mpesaAmount} onChange={(e) => setMpesaAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-secondary border border-border rounded-md pl-14 pr-4 py-3 text-lg font-bold text-foreground outline-none focus:border-primary transition" min={10} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {presetAmountsKES.map((a) => (
                    <button key={a} onClick={() => setMpesaAmount(a)}
                      className={`py-2 rounded-md text-sm font-medium transition ${mpesaAmount === a ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
                      KES {a.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleMpesaDeposit} disabled={mpesaProcessing || mpesaAmount < 10 || !phoneNumber}
                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {mpesaProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending STK Push...</> : `Deposit KES ${mpesaAmount.toLocaleString()}`}
              </button>
            </>
          )}

          {phase.kind === "form" && tab === "crypto" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Cryptocurrency</label>
                <div className="grid grid-cols-2 gap-2">
                  {cryptoCurrencies.map((c) => (
                    <button key={c.id} onClick={() => setSelectedCrypto(c.id)}
                      className={`p-3 rounded-md border text-sm font-medium transition ${selectedCrypto === c.id ? "border-primary bg-primary/10 text-foreground" : "border-border bg-secondary text-secondary-foreground hover:bg-muted"}`}>
                      {c.symbol}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Amount (USD)</label>
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">$</span>
                  <input type="number" value={cryptoAmount} onChange={(e) => setCryptoAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-3 text-lg font-bold text-foreground outline-none focus:border-primary transition" min={5} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {presetAmountsUSD.map((a) => (
                    <button key={a} onClick={() => setCryptoAmount(a)}
                      className={`py-2 rounded-md text-sm font-medium transition ${cryptoAmount === a ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}>
                      ${a}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleCryptoDeposit} disabled={cryptoProcessing || cryptoAmount < 5}
                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {cryptoProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Address...</> : `Deposit $${cryptoAmount} via ${cryptoCurrencies.find((c) => c.id === selectedCrypto)?.symbol}`}
              </button>
            </>
          )}

          {/* ============================== STK SENT PHASE ============================== */}
          {phase.kind === "stk-sent" && (
            <div className="space-y-5 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Animated phone illustration */}
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-primary/30 animate-pulse" />
                <div className="relative w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                  <Smartphone className="w-10 h-10 text-primary" />
                </div>
              </div>

              <div className="text-center space-y-1">
                <h3 className="font-display text-lg font-bold uppercase tracking-wider">STK Push Sent</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a payment prompt to <span className="font-bold text-foreground">{phase.phone}</span>
                </p>
              </div>

              {/* Amount summary */}
              <div className="bg-secondary border border-border rounded-md p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground uppercase tracking-wider">Amount</span>
                  <span className="font-display text-2xl font-bold text-primary">KES {phase.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Live progress indicator */}
              <DepositProgress phase={phase} method="mpesa" />

              <div className="space-y-2.5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Next steps</p>
                {[
                  "Open the M-Pesa prompt on your phone",
                  "Enter your M-Pesa PIN",
                  "Tap OK to authorise the payment",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-foreground">{step}</span>
                  </div>
                ))}
              </div>

              {/* Live wait status */}
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-md px-3 py-2.5">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Waiting for confirmation…</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  {stkRemaining > 0 ? `${stkRemaining}s` : "Almost there…"}
                </span>
              </div>

              <button onClick={resetToForm} className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-md font-medium text-xs uppercase tracking-wider hover:bg-muted transition">
                Cancel & Start Over
              </button>
            </div>
          )}

          {/* ============================== CRYPTO PENDING PHASE ============================== */}
          {phase.kind === "crypto-pending" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center">
                <div className="relative mx-auto w-16 h-16 mb-3">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
                  <div className="relative w-full h-full bg-primary/20 rounded-full flex items-center justify-center">
                    <Bitcoin className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h3 className="font-display text-lg font-bold uppercase tracking-wider">Send Payment</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Send exactly <span className="text-primary font-bold">{phase.pay_amount} {phase.pay_currency.toUpperCase()}</span>
                </p>
              </div>

              <div className="bg-secondary border border-border rounded-md p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Deposit Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-foreground break-all flex-1">{phase.pay_address}</code>
                  <button onClick={() => copyAddress(phase.pay_address)} className="shrink-0 p-2 rounded-md bg-muted hover:bg-accent transition">
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>

              {/* Live progress indicator */}
              <DepositProgress phase={phase} method="crypto" />

              <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-md px-3 py-2.5 text-xs text-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Waiting for blockchain confirmation…</span>
              </div>

              <button onClick={resetToForm} className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-md font-medium text-xs uppercase tracking-wider hover:bg-muted transition">
                Make Another Deposit
              </button>
            </div>
          )}

          {/* ============================== SUCCESS PHASE ============================== */}
          {phase.kind === "success" && (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="relative w-full h-full rounded-full bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-primary" strokeWidth={2.5} />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold uppercase tracking-wider text-primary">Deposit Successful</h3>
                <p className="text-sm text-muted-foreground">
                  {phase.method === "mpesa" ? "KES" : "$"} {phase.amount.toLocaleString()} has been added to your wallet.
                </p>
              </div>

              {profile && (
                <div className="bg-secondary border border-border rounded-md p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">New Balance</p>
                  <p className="font-display text-2xl font-bold text-foreground">{formatMoney(profile.balance, profile)}</p>
                </div>
              )}

              {/* All-steps-complete progress */}
              <DepositProgress phase={phase} method={phase.method} />

              <div className="flex gap-2">
                <button onClick={resetToForm} className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-md font-medium text-xs uppercase tracking-wider hover:bg-muted transition">
                  Deposit More
                </button>
                <button onClick={handleClose} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-md font-display font-bold text-xs uppercase tracking-wider hover:brightness-110 transition glow-green flex items-center justify-center gap-1">
                  Start Betting <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================== FAILED PHASE ============================== */}
          {phase.kind === "failed" && (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="mx-auto w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-destructive" strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold uppercase tracking-wider text-destructive">Deposit Failed</h3>
                <p className="text-sm text-muted-foreground">
                  {phase.reason || (phase.method === "mpesa"
                    ? "The M-Pesa payment was cancelled or timed out."
                    : "The crypto payment didn't go through.")}
                </p>
              </div>

              {/* Failed-state progress */}
              <DepositProgress phase={phase} method={phase.method} />

              <button onClick={resetToForm} className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition">
                Try Again
              </button>
            </div>
          )}

          {/* Coming Soon tabs */}
          {phase.kind === "form" && (tab === "card" || tab === "bank" || tab === "airtel" || tab === "paypal") && (
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold">Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {tab === "card" ? "Visa/Mastercard" : tab === "bank" ? "Bank transfer" : tab === "airtel" ? "Airtel Money" : "PayPal"} deposits will be available soon.
              </p>
              <p className="text-xs text-muted-foreground mt-2">Use M-Pesa or Crypto in the meantime.</p>
            </div>
          )}

          {phase.kind === "form" && (
            <p className="text-[10px] text-muted-foreground text-center">
              Deposits are processed securely. Contact support for any issues.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
