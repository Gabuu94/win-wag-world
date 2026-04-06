import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw } from "lucide-react";

const AdminTransactions = () => {
  const [txns, setTxns] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal">("all");
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    let q = supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("type", filter);
    const { data } = await q;
    setTxns(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Transactions</h2>
        <button onClick={fetch} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "deposit", "withdrawal"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Reference</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : txns.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transactions</TableCell></TableRow>
            ) : txns.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <span className="flex items-center gap-1">
                    {t.type === "deposit" ? <ArrowDownToLine className="w-3 h-3 text-green-400" /> : <ArrowUpFromLine className="w-3 h-3 text-red-400" />}
                    <span className="capitalize text-xs">{t.type}</span>
                  </span>
                </TableCell>
                <TableCell className="font-medium">${Number(t.amount).toFixed(2)}</TableCell>
                <TableCell className="text-xs uppercase">{t.method}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "completed" ? "bg-green-500/20 text-green-400" : t.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                    {t.status}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{t.reference || "-"}</TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminTransactions;
