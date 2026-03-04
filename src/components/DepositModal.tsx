import { useState } from "react";
import { X, DollarSign, CreditCard, Landmark, Smartphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const presetAmounts = [10, 25, 50, 100, 250, 500];

const paymentMethods = [
  { id: "card", label: "Credit Card", icon: CreditCard },
  { id: "bank", label: "Bank Transfer", icon: Landmark },
  { id: "mobile", label: "Mobile Pay", icon: Smartphone },
];

const DepositModal = () => {
  const { showDepositModal, setShowDepositModal, deposit, isLoggedIn, setShowAuthModal } = useAuth();
  const [amount, setAmount] = useState(50);
  const [method, setMethod] = useState("card");
  const [processing, setProcessing] = useState(false);

  if (!showDepositModal) return null;

  const handleDeposit = async () => {
    if (!isLoggedIn) {
      setShowDepositModal(false);
      setShowAuthModal(true);
      return;
    }
    if (amount < 5) {
      toast.error("Minimum deposit is $5");
      return;
    }
    setProcessing(true);
    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 1500));
    deposit(amount);
    setProcessing(false);
    toast.success(`$${amount.toFixed(2)} deposited successfully!`);
    setShowDepositModal(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-xl font-bold uppercase tracking-wider">
            Deposit Funds
          </h2>
          <button
            onClick={() => setShowDepositModal(false)}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Amount
            </label>
            <div className="relative mb-3">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-3 text-lg font-bold text-foreground outline-none focus:border-primary transition"
                min={5}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a)}
                  className={`py-2 rounded-md text-sm font-medium transition ${
                    amount === a
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  ${a}
                </button>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Payment Method
            </label>
            <div className="space-y-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-md border transition ${
                    method === pm.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary hover:bg-muted"
                  }`}
                >
                  <pm.icon className={`w-5 h-5 ${method === pm.id ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Deposit button */}
          <button
            onClick={handleDeposit}
            disabled={processing || amount < 5}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {processing ? "Processing..." : `Deposit $${amount.toFixed(2)}`}
          </button>

          <p className="text-[10px] text-muted-foreground text-center">
            This is a demo. No real money is involved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
