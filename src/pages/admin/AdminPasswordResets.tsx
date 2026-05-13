import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, Check, X, Loader2 } from "lucide-react";

interface ResetRequest {
  id: string;
  phone: string;
  status: string;
  notes: string | null;
  created_at: string;
}

const AdminPasswordResets = () => {
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<string | null>(null);
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("password_reset_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setRequests((data as ResetRequest[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleReset = async (req: ResetRequest) => {
    const pwd = newPasswords[req.id];
    if (!pwd || pwd.length < 5) {
      toast.error("Password must be at least 5 characters");
      return;
    }
    setResetting(req.id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: { phone: req.phone, newPassword: pwd, requestId: req.id },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || error?.message || "Reset failed");
      } else {
        toast.success(`Password reset for ${req.phone}`);
        setNewPasswords((p) => { const n = { ...p }; delete n[req.id]; return n; });
        fetchRequests();
      }
    } finally {
      setResetting(null);
    }
  };

  const handleReject = async (req: ResetRequest) => {
    const { error } = await supabase
      .from("password_reset_requests")
      .update({ status: "rejected", resolved_at: new Date().toISOString() })
      .eq("id", req.id);
    if (error) toast.error("Failed to reject"); else { toast.success("Rejected"); fetchRequests(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <KeyRound className="w-6 h-6 text-primary" />
        <h1 className="font-display text-2xl font-bold">Password Reset Requests</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No reset requests yet</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-mono text-sm font-bold">{r.phone}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  {r.notes && <div className="text-xs text-muted-foreground mt-1">Note: {r.notes}</div>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  r.status === "pending" ? "bg-amber-500/20 text-amber-500" :
                  r.status === "done" ? "bg-primary/20 text-primary" :
                  "bg-destructive/20 text-destructive"
                }`}>
                  {r.status}
                </span>
              </div>

              {r.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="New password (min 5)"
                    value={newPasswords[r.id] || ""}
                    onChange={(e) => setNewPasswords((p) => ({ ...p, [r.id]: e.target.value }))}
                    className="flex-1 min-w-[180px] bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => handleReset(r)}
                    disabled={resetting === r.id}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:brightness-110 transition disabled:opacity-40 flex items-center gap-1"
                  >
                    {resetting === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Reset
                  </button>
                  <button
                    onClick={() => handleReject(r)}
                    className="bg-destructive/20 text-destructive px-3 py-2 rounded-md text-sm hover:bg-destructive/30 transition flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPasswordResets;
