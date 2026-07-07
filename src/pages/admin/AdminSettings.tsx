import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings2, Save } from "lucide-react";

const CHANNEL_ID_PATTERN = /^CH_[A-Z0-9]{6,20}$/;

const AdminSettings = () => {
  const [channelId, setChannelId] = useState("");
  const [initial, setInitial] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "lipwa_channel_id")
        .maybeSingle();
      if (error) toast.error(error.message);
      const v = data?.value || "";
      setChannelId(v);
      setInitial(v);
      setLoading(false);
    })();
  }, []);

  const validate = (raw: string): string | null => {
    const value = raw.trim();
    if (!value) return "Channel ID cannot be empty.";
    if (value.length > 24) return "Channel ID is too long (max 24 characters).";
    if (!value.startsWith("CH_")) return 'Channel ID must start with "CH_" (e.g. CH_23BD07DB).';
    if (!CHANNEL_ID_PATTERN.test(value)) {
      return 'Channel ID must be "CH_" followed by 6-20 uppercase letters or digits (e.g. CH_23BD07DB).';
    }
    return null;
  };

  const friendlyError = (msg: string): string => {
    if (!msg) return "Could not save. Please try again.";
    // Trigger raises with our custom message — surface it directly.
    if (msg.includes("Lipwa channel ID") || msg.includes("cannot be empty")) return msg;
    if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("row-level security")) {
      return "You don't have permission to change payment settings.";
    }
    return msg;
  };

  const onChange = (v: string) => {
    const up = v.toUpperCase();
    setChannelId(up);
    setError(up.trim() === initial ? null : validate(up));
  };

  const save = async () => {
    const value = channelId.trim();
    const validationError = validate(value);
    if (validationError) { setError(validationError); toast.error(validationError); return; }

    setSaving(true);
    setError(null);
    const { data: userRes } = await supabase.auth.getUser();
    const { error: dbError } = await supabase
      .from("app_settings")
      .upsert(
        { key: "lipwa_channel_id", value, updated_by: userRes.user?.id, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    setSaving(false);
    if (dbError) {
      const msg = friendlyError(dbError.message);
      setError(msg);
      toast.error(msg);
      return;
    }
    setInitial(value);
    toast.success("Lipwa channel ID updated");
  };

  const trimmed = channelId.trim();
  const dirty = trimmed !== initial;
  const disabled = saving || loading || !dirty || !!error;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">Payment Settings</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-sm mb-1">Lipwa Channel ID</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Used by M-Pesa STK Push. Format: <code className="font-mono">CH_</code> followed by 6-20 uppercase letters or digits. Must match a channel configured on your Lipwa account.
          </p>
          <input
            type="text"
            value={channelId}
            onChange={(e) => onChange(e.target.value)}
            disabled={loading}
            placeholder="e.g. CH_23BD07DB"
            aria-invalid={!!error}
            className={`w-full bg-secondary border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 ${
              error ? "border-destructive focus:ring-destructive" : "border-border focus:ring-primary"
            }`}
          />
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>

        <button
          onClick={save}
          disabled={disabled}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
