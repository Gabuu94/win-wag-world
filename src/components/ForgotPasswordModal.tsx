import { useState, useEffect } from "react";
import { X, KeyRound, Mail, Phone, Globe, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const COUNTRIES = [
  { code: "KE", dial: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "NG", dial: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "GH", dial: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "TZ", dial: "+255", flag: "🇹🇿", name: "Tanzania" },
  { code: "UG", dial: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "ZA", dial: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "US", dial: "+1", flag: "🇺🇸", name: "United States" },
  { code: "GB", dial: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "CM", dial: "+237", flag: "🇨🇲", name: "Cameroon" },
  { code: "ET", dial: "+251", flag: "🇪🇹", name: "Ethiopia" },
  { code: "RW", dial: "+250", flag: "🇷🇼", name: "Rwanda" },
  { code: "CD", dial: "+243", flag: "🇨🇩", name: "DR Congo" },
  { code: "IN", dial: "+91", flag: "🇮🇳", name: "India" },
  { code: "BR", dial: "+55", flag: "🇧🇷", name: "Brazil" },
];

const ForgotPasswordModal = () => {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState("KE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { dial?: string; phone?: string } | undefined;
      if (detail?.dial) {
        const c = COUNTRIES.find((x) => x.dial === detail.dial);
        if (c) setCountry(c.code);
      }
      if (detail?.phone) setPhone(detail.phone);
      setOpen(true);
      setSent(false);
    };
    window.addEventListener("betking:open-forgot-password", handler);
    return () => window.removeEventListener("betking:open-forgot-password", handler);
  }, []);

  if (!open) return null;

  const selectedCountry = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];

  const close = () => {
    setOpen(false);
    setPhone("");
    setEmail("");
    setSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !email.trim()) {
      toast.error("Please enter both your phone number and email");
      return;
    }
    setSubmitting(true);
    try {
      const fullPhone = `${selectedCountry.dial}${phone.replace(/^0+/, "")}`;
      const { error } = await supabase.functions.invoke("request-password-reset", {
        body: {
          phone: fullPhone,
          email: email.trim().toLowerCase(),
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      // Always show generic success — never reveal whether the account exists
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" /> Reset Password
          </h2>
          <button onClick={close} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="p-6 space-y-4 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold">Check your email</h3>
            <p className="text-sm text-muted-foreground">
              If an account matches the phone and email you entered, we've sent a password reset link.
              The link expires in 30 minutes.
            </p>
            <p className="text-xs text-muted-foreground">
              Didn't receive it? Check your spam folder or try again.
            </p>
            <button
              onClick={close}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the phone number and recovery email on your account. We'll send a secure reset link to your inbox.
            </p>

            {/* Country */}
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary transition appearance-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.dial})
                  </option>
                ))}
              </select>
            </div>

            {/* Phone */}
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

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="Recovery email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition"
                required
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {submitting ? "Sending..." : "Send Reset Link"}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              Use the same recovery email you added when creating your BETKING account.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
