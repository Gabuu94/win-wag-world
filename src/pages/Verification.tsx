import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Upload, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { toast } from "sonner";

const DOC_TYPES = [
  { key: "national_id", label: "National ID / Passport" },
  { key: "proof_of_address", label: "Proof of Address" },
  { key: "selfie", label: "Selfie with ID" },
];

const STATUS_MAP: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-accent", label: "Under Review" },
  approved: { icon: CheckCircle2, color: "text-primary", label: "Approved" },
  rejected: { icon: XCircle, color: "text-destructive", label: "Rejected" },
};

const Verification = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, setShowAuthModal } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("verification_documents").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) setDocs(data);
      setLoading(false);
    });
  }, [user]);

  const handleSubmit = async (docType: string) => {
    if (!user) return;
    setSubmitting(docType);

    // In a real app, you'd upload a file here. For now, we create a pending verification entry.
    const { error } = await supabase.from("verification_documents").insert({
      user_id: user.id,
      doc_type: docType,
      status: "pending",
      file_url: null,
    });

    if (error) {
      toast.error("Failed to submit. Please try again.");
    } else {
      toast.success("Document submitted for review!");
      // Refresh
      const { data } = await supabase.from("verification_documents").select("*").eq("user_id", user.id);
      if (data) setDocs(data);
    }
    setSubmitting(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShieldCheck className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">Sign in to verify your account</p>
            <button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold text-sm">Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  const getDocStatus = (docType: string) => docs.find((d) => d.doc_type === docType);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="font-display text-2xl font-bold mb-2 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> Account Verification
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Verify your identity to unlock higher withdrawal limits and enhanced security.</p>

        <div className="space-y-3">
          {DOC_TYPES.map((doc) => {
            const existing = getDocStatus(doc.key);
            const statusInfo = existing ? STATUS_MAP[existing.status] || STATUS_MAP.pending : null;
            const StatusIcon = statusInfo?.icon;

            return (
              <div key={doc.key} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{doc.label}</p>
                    {statusInfo && StatusIcon && (
                      <p className={`text-xs flex items-center gap-1 mt-1 ${statusInfo.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" /> {statusInfo.label}
                      </p>
                    )}
                  </div>
                  {!existing ? (
                    <button
                      onClick={() => handleSubmit(doc.key)}
                      disabled={submitting === doc.key}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:brightness-110 transition disabled:opacity-50"
                    >
                      {submitting === doc.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Submit
                    </button>
                  ) : existing.status === "rejected" ? (
                    <button
                      onClick={() => handleSubmit(doc.key)}
                      disabled={submitting === doc.key}
                      className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:brightness-110 transition disabled:opacity-50"
                    >
                      Re-submit
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-secondary/50 rounded-xl p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Why verify?</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Higher withdrawal limits</li>
            <li>Faster withdrawal processing</li>
            <li>Enhanced account security</li>
            <li>Access to exclusive VIP features</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Verification;
