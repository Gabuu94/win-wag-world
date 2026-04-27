import { useState, useEffect } from "react";
import { X, KeyRound, Mail, Send } from "lucide-react";

const ForgotPasswordModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("betking:open-forgot-password", handler);
    return () => window.removeEventListener("betking:open-forgot-password", handler);
  }, []);

  if (!open) return null;

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

        <div className="p-6 space-y-5">
          <p className="text-sm text-muted-foreground">
            To reset your password, please contact our support team. We'll verify your identity and reset it as soon as possible.
          </p>

          <a
            href="mailto:support@betking.space?subject=Password%20Reset%20Request"
            className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green"
          >
            <Mail className="w-4 h-4" /> Email support@betking.space
          </a>

          <a
            href="https://t.me/betking_help"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-secondary border border-border text-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:border-primary hover:text-primary transition"
          >
            <Send className="w-4 h-4" /> Chat on Telegram
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
