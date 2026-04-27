import { useState, useEffect } from "react";
import { X, Phone, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const COUNTRIES = [
  { code: "KE", dial: "+254", flag: "🇰🇪" },
  { code: "NG", dial: "+234", flag: "🇳🇬" },
  { code: "GH", dial: "+233", flag: "🇬🇭" },
  { code: "TZ", dial: "+255", flag: "🇹🇿" },
  { code: "UG", dial: "+256", flag: "🇺🇬" },
  { code: "ZA", dial: "+27", flag: "🇿🇦" },
  { code: "US", dial: "+1", flag: "🇺🇸" },
  { code: "GB", dial: "+44", flag: "🇬🇧" },
];

const ForgotPasswordModal = () => {
  const [open, setOpen] = useState(false);
  const [dial, setDial] = useState("+254");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail?.dial) setDial(e.detail.dial);
      if (e?.detail?.phone) setPhone(e.detail.phone);
      setOpen(true);
    };
    window.addEventListener("betking:open-forgot-password", handler);
    return () => window.removeEventListener("betking:open-forgot-password", handler);
  }, []);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Enter your phone number");
      return;
    }
    setSubmitting(true);
    const fullPhone = `${dial}${phone.replace(/^0+/, "")}`;
    const { error } = await supabase.from("password_reset_requests").insert({
      phone: fullPhone,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit request. Try again.");
    } else {
      toast.success("Request submitted! Support will reset your password shortly.");
      setOpen(false);
      setPhone("");
      setNotes("");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" /> Reset Password
          </h2>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your registered phone number. Our support team will verify and reset your password — you'll be notified once it's done.
          </p>

          <div className="flex gap-2">
            <select
              value={dial}
              onChange={(e) => setDial(e.target.value)}
              className="bg-secondary border border-border rounded-md px-2 py-3 text-sm outline-none focus:border-primary"
            >
              {COUNTRIES.map(c => <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>)}
            </select>
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-3 text-sm outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <textarea
            placeholder="Optional: any details to help support verify it's you (e.g. username, last deposit)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary resize-none"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green disabled:opacity-40"
          >
            {submitting ? "Submitting..." : "Submit Reset Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
