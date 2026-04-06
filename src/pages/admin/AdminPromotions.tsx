import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Promotion {
  id: string;
  title: string;
  description: string;
  bonus_type: string;
  bonus_value: number;
  min_deposit: number;
  start_date: string;
  end_date: string | null;
  active: boolean;
}

const AdminPromotions = () => {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", bonus_type: "deposit_match", bonus_value: 100, min_deposit: 10, end_date: "" });

  const fetchPromos = async () => {
    const { data } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
    setPromos((data as any[]) || []);
  };

  useEffect(() => { fetchPromos(); }, []);

  const createPromo = async () => {
    if (!form.title || !form.description) return;
    const { error } = await supabase.from("promotions").insert({
      title: form.title,
      description: form.description,
      bonus_type: form.bonus_type,
      bonus_value: form.bonus_value,
      min_deposit: form.min_deposit,
      end_date: form.end_date || null,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Promotion created!" });
    setShowForm(false);
    setForm({ title: "", description: "", bonus_type: "deposit_match", bonus_value: 100, min_deposit: 10, end_date: "" });
    fetchPromos();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("promotions").update({ active: !active }).eq("id", id);
    fetchPromos();
  };

  const deletePromo = async (id: string) => {
    await supabase.from("promotions").delete().eq("id", id);
    fetchPromos();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Promotions</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm">
          <Plus className="w-4 h-4" /> New Promotion
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-secondary rounded-md px-3 py-2 text-sm outline-none min-h-[80px]" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.bonus_type} onChange={(e) => setForm({ ...form, bonus_type: e.target.value })} className="bg-secondary rounded-md px-3 py-2 text-sm outline-none">
              <option value="deposit_match">Deposit Match %</option>
              <option value="free_bet">Free Bet $</option>
              <option value="cashback">Cashback %</option>
            </select>
            <Input type="number" placeholder="Bonus Value" value={form.bonus_value} onChange={(e) => setForm({ ...form, bonus_value: Number(e.target.value) })} />
            <Input type="number" placeholder="Min Deposit" value={form.min_deposit} onChange={(e) => setForm({ ...form, min_deposit: Number(e.target.value) })} />
            <Input type="datetime-local" placeholder="End Date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={createPromo} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">Create</button>
            <button onClick={() => setShowForm(false)} className="bg-secondary px-4 py-2 rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {promos.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">{p.title}</h3>
              <p className="text-xs text-muted-foreground">{p.description.slice(0, 80)}...</p>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.bonus_type}: {p.bonus_value}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {p.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => toggleActive(p.id, p.active)} className="p-2 rounded hover:bg-secondary" title="Toggle">
                {p.active ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
              </button>
              <button onClick={() => deletePromo(p.id)} className="p-2 rounded hover:bg-destructive/10 text-destructive" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {promos.length === 0 && <p className="text-center py-8 text-muted-foreground">No promotions yet</p>}
      </div>
    </div>
  );
};

export default AdminPromotions;
