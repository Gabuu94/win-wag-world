import { useState, useEffect } from "react";
import { X, Lock, User, Gift, Phone, Globe } from "lucide-react";
import { useAuth, phoneToSyntheticEmail } from "@/context/AuthContext";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

const COUNTRIES = [
  { code: "KE", name: "Kenya", dial: "+254", currency: "KES", flag: "🇰🇪" },
  { code: "NG", name: "Nigeria", dial: "+234", currency: "NGN", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", dial: "+233", currency: "GHS", flag: "🇬🇭" },
  { code: "TZ", name: "Tanzania", dial: "+255", currency: "TZS", flag: "🇹🇿" },
  { code: "UG", name: "Uganda", dial: "+256", currency: "UGX", flag: "🇺🇬" },
  { code: "ZA", name: "South Africa", dial: "+27", currency: "ZAR", flag: "🇿🇦" },
  { code: "US", name: "United States", dial: "+1", currency: "USD", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dial: "+44", currency: "GBP", flag: "🇬🇧" },
  { code: "CM", name: "Cameroon", dial: "+237", currency: "XAF", flag: "🇨🇲" },
  { code: "ET", name: "Ethiopia", dial: "+251", currency: "ETB", flag: "🇪🇹" },
  { code: "RW", name: "Rwanda", dial: "+250", currency: "RWF", flag: "🇷🇼" },
  { code: "CD", name: "DR Congo", dial: "+243", currency: "CDF", flag: "🇨🇩" },
  { code: "IN", name: "India", dial: "+91", currency: "INR", flag: "🇮🇳" },
  { code: "BR", name: "Brazil", dial: "+55", currency: "BRL", flag: "🇧🇷" },
];

const AuthModal = () => {
  const { showAuthModal, setShowAuthModal, login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [country, setCountry] = useState("KE");
  const [submitting, setSubmitting] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) setReferralCode(refCode);
  }, [searchParams]);

  if (!showAuthModal) return null;

  const selectedCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    setSubmitting(true);
    try {
      const fullPhone = `${selectedCountry.dial}${phone.replace(/^0+/, "")}`;
      const syntheticEmail = phoneToSyntheticEmail(fullPhone);

      if (isLogin) {
        const result = await login(syntheticEmail, password);
        if (result.error) {
          toast.error("Invalid phone number or password");
        } else {
          toast.success("Welcome back!");
          setShowAuthModal(false);
          resetForm();
        }
      } else {
        if (!username.trim()) {
          toast.error("Username is required");
          setSubmitting(false);
          return;
        }
        const result = await signup(username, syntheticEmail, password, referralCode || undefined, fullPhone, country, selectedCountry.currency);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Account created! Welcome to BetKing!");
          setShowAuthModal(false);
          resetForm();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    setPhone("");
    setPassword("");
    setReferralCode("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-xl font-bold uppercase tracking-wider">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>
          <button
            onClick={() => { setShowAuthModal(false); resetForm(); }}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition"
                  required={!isLogin}
                />
              </div>

              {/* Country Picker */}
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary transition appearance-none"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name} ({c.currency})</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Phone Number — used as the login identifier */}
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <div className="flex">
              <span className="bg-secondary border border-border border-r-0 rounded-l-md px-3 py-3 text-sm text-muted-foreground flex items-center min-w-[70px]">
                {selectedCountry.dial}
              </span>
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-secondary border border-border rounded-r-md px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition"
                required
              />
            </div>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition"
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Referral code (optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green disabled:opacity-40"
          >
            {submitting ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); resetForm(); }}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
