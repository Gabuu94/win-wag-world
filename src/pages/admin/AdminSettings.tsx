import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings2, Save } from "lucide-react";

const AdminSettings = () => {
  const [channelId, setChannelId] = useState("");
  const [initial, setInitial] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const save = async () => {
    const value = channelId.trim();
    if (!value) { toast.error("Channel ID cannot be empty"); return; }
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "lipwa_channel_id", value, updated_by: userRes.user?.id, updated_at: new Date().toISOString() }, { onConflict: "key" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setInitial(value);
    toast.success("Lipwa channel ID updated");
  };

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
            Used by M-Pesa STK Push. Must match a channel configured on your Lipwa account.
          </p>
          <input
            type="text"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            disabled={loading}
            placeholder="e.g. CH_23BD07DB"
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          onClick={save}
          disabled={saving || loading || channelId.trim() === initial}
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
