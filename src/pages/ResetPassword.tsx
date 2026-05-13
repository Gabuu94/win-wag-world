import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, KeyRound, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Status = "validating" | "valid" | "invalid" | "submitting" | "done";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<Status>("validating");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    document.title = "Reset Password | BETKING";
    if (!token) {
      setStatus("invalid");
      setErrorMsg("No reset token found in the link.");
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("confirm-password-reset", {
          body: { token, action: "validate" },
        });
        if (error || !(data as any)?.valid) {
          setStatus("invalid");
          setErrorMsg((data as any)?.error || "This link is invalid or has expired.");
        } else {
          setStatus("valid");
        }
      } catch (err: any) {
        setStatus("invalid");
        setErrorMsg(err?.message || "This link is invalid or has expired.");
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 5) {
      toast.error("Password must be at least 5 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setStatus("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("confirm-password-reset", {
        body: { token, newPassword: password },
      });
      if (error || !(data as any)?.success) {
        toast.error((data as any)?.error || "Failed to reset password");
        setStatus("valid");
        return;
      }
      setStatus("done");
      toast.success("Password updated! Sign in with your new password.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset password");
      setStatus("valid");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-bold uppercase tracking-wider">Reset Password</h1>
        </div>

        <div className="p-6">
          {status === "validating" && (
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin" /> Validating your link...
            </div>
          )}

          {status === "invalid" && (
            <div className="space-y-4 text-center">
              <XCircle className="w-12 h-12 mx-auto text-destructive" />
              <h2 className="font-display text-xl font-bold">Link not valid</h2>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110"
              >
                Back to Home
              </button>
            </div>
          )}

          {(status === "valid" || status === "submitting") && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose a new password for your account.</p>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-3 text-sm outline-none focus:border-primary"
                  required
                  minLength={5}
                  autoComplete="new-password"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-md pl-10 pr-4 py-3 text-sm outline-none focus:border-primary"
                  required
                  minLength={5}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {status === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {status === "submitting" ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          {status === "done" && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
              <h2 className="font-display text-xl font-bold">Password updated</h2>
              <p className="text-sm text-muted-foreground">
                You can now sign in to BETKING with your new password.
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110"
              >
                Continue to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
