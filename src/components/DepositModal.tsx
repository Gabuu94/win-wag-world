import { useEffect, useState } from "react";
import { X, Smartphone, Bitcoin, Copy, Check, Loader2, CreditCard, Landmark, Lock, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isKenyan } from "@/lib/currency";

type PaymentTab = "mpesa" | "crypto" | "card" | "bank" | "airtel" | "paypal";

const cryptoCurrencies = [
  { id: "btc", label: "Bitcoin", symbol: "BTC" },
  { id: "eth", label: "Ethereum", symbol: "ETH" },
  { id: "usdttrc20", label: "USDT (TRC20)", symbol: "USDT" },
  { id: "ltc", label: "Litecoin", symbol: "LTC" },
];

const presetAmountsKES = [100, 250, 500, 1000, 2500, 5000];
const presetAmountsUSD = [5, 10, 25, 50, 100, 250];

const tabs: { key: PaymentTab; label: string; icon: any; active: boolean }[] = [
  { key: "mpesa", label: "M-Pesa", icon: Smartphone, active: true },
  { key: "crypto", label: "Crypto", icon: Bitcoin, active: true },
  { key: "airtel", label: "Airtel", icon: Smartphone, active: false },
  { key: "card", label: "Card", icon: CreditCard, active: false },
  { key: "bank", label: "Bank", icon: Landmark, active: false },
  { key: "paypal", label: "PayPal", icon: Wallet, active: false },
];

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
  const [stkSent, setStkSent] = useState(false);

  const [cryptoAmount, setCryptoAmount] = useState(25);
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [cryptoProcessing, setCryptoProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    pay_address: string;
    pay_amount: number;
    pay_currency: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!showDepositModal) return null;

  const handleClose = () => {
    setShowDepositModal(false);
    setStkSent(false);
    setPaymentDetails(null);
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
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        method: "mpesa",
        amount: mpesaAmount,
        status: "pending",
        reference: phoneNumber,
      });

      const { data, error } = await supabase.functions.invoke("mpesa-deposit", {
        body: { phone_number: phoneNumber, amount: mpesaAmount, user_id: user.id },
      });

      if (error) throw error;
      if (data?.success) {
        setStkSent(true);
        toast.success("STK Push sent! Check your phone to complete payment.");
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
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        method: "crypto",
        amount: cryptoAmount,
        status: "pending",
        reference: selectedCrypto,
      });

      const { data, error } = await supabase.functions.invoke("crypto-deposit", {
        body: { amount_usd: cryptoAmount, currency: selectedCrypto, user_id: user.id },
      });

      if (error) throw error;
      if (data?.success) {
        setPaymentDetails({
          pay_address: data.pay_address,
          pay_amount: data.pay_amount,
          pay_currency: data.pay_currency,
        });
        toast.success("Payment address generated!");
      } else {
        toast.error(data?.error || "Failed to create crypto payment");
      }
    } catch (err: any) {
      toast.error(err.message || "Crypto deposit failed");
    } finally {
      setCryptoProcessing(false);
    }
  };

  const copyAddress = () => {
    if (paymentDetails?.pay_address) {
      navigator.clipboard.writeText(paymentDetails.pay_address);
      setCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-xl font-bold uppercase tracking-wider">Deposit Funds</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-border overflow-x-auto">
          {tabs.map((t) => (
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

        <div className="p-6 space-y-5">
          {/* M-Pesa Tab */}
          {tab === "mpesa" && !stkSent && (
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

          {tab === "mpesa" && stkSent && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold">Check Your Phone</h3>
              <p className="text-sm text-muted-foreground">An M-Pesa STK Push has been sent. Enter your PIN to complete.</p>
              <p className="text-xs text-muted-foreground">Your balance updates automatically once confirmed.</p>
              <button onClick={() => { setStkSent(false); refreshProfile(); }}
                className="w-full bg-secondary text-secondary-foreground py-3 rounded-md font-medium text-sm hover:bg-muted transition">
                Make Another Deposit
              </button>
            </div>
          )}

          {/* Crypto Tab */}
          {tab === "crypto" && !paymentDetails && (
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

          {tab === "crypto" && paymentDetails && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-3">
                  <Bitcoin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold">Send Payment</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Send exactly <span className="text-foreground font-bold">{paymentDetails.pay_amount} {paymentDetails.pay_currency.toUpperCase()}</span> to:
                </p>
              </div>
              <div className="bg-secondary border border-border rounded-md p-3">
                <p className="text-xs text-muted-foreground mb-1">Deposit Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-foreground break-all flex-1">{paymentDetails.pay_address}</code>
                  <button onClick={copyAddress} className="shrink-0 p-2 rounded-md bg-muted hover:bg-accent transition">
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">Balance updates automatically once confirmed on the blockchain.</p>
              <button onClick={() => { setPaymentDetails(null); refreshProfile(); }}
                className="w-full bg-secondary text-secondary-foreground py-3 rounded-md font-medium text-sm hover:bg-muted transition">
                Make Another Deposit
              </button>
            </div>
          )}

          {/* Coming Soon tabs */}
          {(tab === "card" || tab === "bank" || tab === "airtel" || tab === "paypal") && (
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-display text-lg font-bold">Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {tab === "card" ? "Visa/Mastercard" : tab === "bank" ? "Bank transfer" : tab === "airtel" ? "Airtel Money" : "PayPal"} deposits will be available soon.
              </p>
              <p className="text-xs text-muted-foreground mt-2">Use M-Pesa or Crypto in the meantime.</p>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center">
            Deposits are processed securely. Contact support for any issues.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
