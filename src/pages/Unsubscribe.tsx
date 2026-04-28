import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Status = "validating" | "valid" | "invalid" | "already" | "submitting" | "done";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<Status>("validating");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Unsubscribe | BETKING";
    if (!token) {
      setStatus("invalid");
      setError("No token found in the link.");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (data.valid) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else {
          setStatus("invalid");
          setError(data.error || "Invalid or expired link.");
        }
      } catch {
        setStatus("invalid");
        setError("Could not validate this link.");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setStatus("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if ((data as any)?.success) setStatus("done");
      else if ((data as any)?.reason === "already_unsubscribed") setStatus("already");
      else {
        setStatus("invalid");
        setError("Could not process unsubscribe.");
      }
    } catch (err: any) {
      setStatus("invalid");
      setError(err?.message || "Failed to unsubscribe.");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
          <Mail className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-xl font-bold uppercase tracking-wider">Email Preferences</h1>

        {status === "validating" && (
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Validating...
          </p>
        )}

        {status === "valid" && (
          <>
            <p className="text-sm text-muted-foreground">
              Click below to unsubscribe from BETKING emails. You can resubscribe anytime by contacting support.
            </p>
            <button
              onClick={confirm}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110"
            >
              Confirm Unsubscribe
            </button>
          </>
        )}

        {status === "submitting" && (
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Updating preferences...
          </p>
        )}

        {status === "done" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">You've been unsubscribed. Sorry to see you go.</p>
          </>
        )}

        {status === "already" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">You're already unsubscribed.</p>
          </>
        )}

        {status === "invalid" && (
          <>
            <XCircle className="w-10 h-10 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        )}
      </div>
    </main>
  );
};

export default Unsubscribe;
