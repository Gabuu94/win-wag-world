import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Ban, CheckCircle, Trash2, RefreshCw } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  user_id: string;
  username: string;
  balance: number;
  total_wagered: number;
  referral_code: string | null;
  created_at: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setCustomers((data as Customer[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter((c) => 
    c.username.toLowerCase().includes(search.toLowerCase()) || c.user_id.includes(search)
  );

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    // Use edge function for user deletion (requires service role)
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const { data: { session } } = await supabase.auth.getSession();
    
    const resp = await fetch(`${baseUrl}/functions/v1/admin-action`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}`, apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_user", target_user_id: userId }),
    });
    const result = await resp.json();
    if (result.success) {
      toast({ title: "User deleted" });
      fetchCustomers();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Customers</h2>
        <button onClick={fetchCustomers} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="flex items-center bg-secondary rounded-md px-3 py-2 mb-4">
        <Search className="w-4 h-4 text-muted-foreground mr-2" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by username or ID..." className="bg-transparent text-sm outline-none flex-1" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="hidden md:table-cell">Wagered</TableHead>
              <TableHead className="hidden md:table-cell">Referral</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.username}</TableCell>
                  <TableCell>${Number(c.balance).toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">${Number(c.total_wagered).toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell">{c.referral_code || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(c.user_id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCustomers;
