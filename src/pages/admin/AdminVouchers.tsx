import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, ToggleLeft, ToggleRight, Pencil, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Voucher {
  id: string;
  code: string;
  amount: number;
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

const emptyForm = { code: "", amount: 10, max_uses: 1, expires_at: "" };

const AdminVouchers = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchVouchers = async () => {
    const { data, error } = await supabase
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading vouchers", description: error.message, variant: "destructive" });
      return;
    }
    setVouchers((data as any[]) || []);
  };

  useEffect(() => { fetchVouchers(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (v: Voucher) => {
    setEditingId(v.id);
    setForm({
      code: v.code,
      amount: Number(v.amount),
      max_uses: v.max_uses,
      expires_at: v.expires_at ? new Date(v.expires_at).toISOString().slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const saveVoucher = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      toast({ title: "Code required", variant: "destructive" });
      return;
    }
    if (form.amount <= 0) {
      toast({ title: "Amount must be greater than 0", variant: "destructive" });
      return;
    }
    if (form.max_uses < 1) {
      toast({ title: "Max uses must be at least 1", variant: "destructive" });
      return;
    }

    const payload = {
      code,
      amount: form.amount,
      max_uses: form.max_uses,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    if (editingId) {
      const { error } = await supabase.from("vouchers").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Voucher updated" });
    } else {
      const { error } = await supabase.from("vouchers").insert({ ...payload, active: true });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Voucher created", description: `Players can redeem ${code}` });
    }
    resetForm();
    fetchVouchers();
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("vouchers").update({ active: !active }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    fetchVouchers();
  };

  const deleteVoucher = async (id: string) => {
    if (!confirm("Delete this voucher? This cannot be undone.")) return;
    const { error } = await supabase.from("vouchers").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    fetchVouchers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Vouchers</h2>
          <p className="text-xs text-muted-foreground mt-1">Create promo codes that players redeem for bonus balance</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm"
        >
          <Plus className="w-4 h-4" /> New Voucher
        </button>
      </div>

      {/* Rules */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Redemption Rules</h3>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
          <li>Codes are case-insensitive and stored in UPPERCASE.</li>
          <li>Each player can redeem a given code only once.</li>
          <li>Total redemptions across all players are capped by <span className="text-foreground">Max Uses</span>.</li>
          <li>Expired or deactivated codes cannot be redeemed.</li>
          <li>On redemption, the amount is credited to the player's main balance.</li>
        </ul>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{editingId ? "Edit Voucher" : "New Voucher"}</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Code</label>
            <Input
              placeholder="WELCOME50"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Bonus Amount</label>
              <Input type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Max Uses (total)</label>
              <Input type="number" min={1} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Expiry (optional — leave blank for never)</label>
              <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveVoucher} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">
              {editingId ? "Save Changes" : "Create"}
            </button>
            <button onClick={resetForm} className="bg-secondary px-4 py-2 rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {vouchers.map((v) => {
          const expired = v.expires_at && new Date(v.expires_at) < new Date();
          const fullyUsed = v.current_uses >= v.max_uses;
          return (
            <div key={v.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-mono font-bold text-base">{v.code}</h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">${Number(v.amount).toFixed(2)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${v.active && !expired && !fullyUsed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {!v.active ? "Inactive" : expired ? "Expired" : fullyUsed ? "Fully Redeemed" : "Active"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Used {v.current_uses} / {v.max_uses}
                  {v.expires_at && <> · Expires {new Date(v.expires_at).toLocaleString()}</>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => startEdit(v)} className="p-2 rounded hover:bg-secondary" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => toggleActive(v.id, v.active)} className="p-2 rounded hover:bg-secondary" title="Toggle active">
                  {v.active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                </button>
                <button onClick={() => deleteVoucher(v.id)} className="p-2 rounded hover:bg-destructive/10 text-destructive" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {vouchers.length === 0 && <p className="text-center py-8 text-muted-foreground">No vouchers yet</p>}
      </div>
    </div>
  );
};

export default AdminVouchers;
