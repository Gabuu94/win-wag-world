import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Trash2, RefreshCw, UserPlus, Shield, CheckSquare, Square, Ban, CheckCircle } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  user_id: string;
  username: string;
  balance: number;
  total_wagered: number;
  referral_code: string | null;
  created_at: string;
  phone?: string;
  country?: string;
  currency?: string;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [regForm, setRegForm] = useState({ email: "", username: "", password: "" });
  const [adminForm, setAdminForm] = useState({ email: "", username: "", password: "" });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchCustomers = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setCustomers((data as Customer[]) || []);
    setSelectedIds(new Set());
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter((c) => 
    c.username.toLowerCase().includes(search.toLowerCase()) || c.user_id.includes(search)
  );

  const toggleSelect = (userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.user_id)));
    }
  };

  const callAdminAction = async (body: Record<string, any>) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const { data: { session } } = await supabase.auth.getSession();
    const resp = await fetch(`${baseUrl}/functions/v1/admin-action`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session?.access_token}`, apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return resp.json();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    const result = await callAdminAction({ action: "delete_user", target_user_id: userId });
    if (result.success) {
      toast({ title: "User deleted" });
      fetchCustomers();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} users? This cannot be undone.`)) return;
    let success = 0;
    for (const userId of selectedIds) {
      const result = await callAdminAction({ action: "delete_user", target_user_id: userId });
      if (result.success) success++;
    }
    toast({ title: `${success}/${selectedIds.size} users deleted` });
    fetchCustomers();
  };

  const handleBulkCredit = async () => {
    const amount = prompt("Enter amount to credit to all selected users:");
    if (!amount || isNaN(Number(amount))) return;
    let success = 0;
    for (const userId of selectedIds) {
      const { data: profile } = await supabase.from("profiles").select("balance").eq("user_id", userId).single();
      if (profile) {
        const { error } = await supabase.from("profiles").update({ balance: Number(profile.balance) + Number(amount) }).eq("user_id", userId);
        if (!error) success++;
      }
    }
    toast({ title: `Credited ${success} users with $${amount}` });
    fetchCustomers();
  };

  const handleRegisterClient = async () => {
    if (!regForm.email || !regForm.username || !regForm.password) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    const result = await callAdminAction({ action: "register_user", email: regForm.email, username: regForm.username, password: regForm.password });
    if (result.success) {
      toast({ title: "Client registered successfully!" });
      setRegForm({ email: "", username: "", password: "" });
      setShowRegister(false);
      fetchCustomers();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleAddAdmin = async () => {
    if (!adminForm.email || !adminForm.username || !adminForm.password) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    const result = await callAdminAction({ action: "create_admin", email: adminForm.email, username: adminForm.username, password: adminForm.password });
    if (result.success) {
      toast({ title: "Admin created successfully!" });
      setAdminForm({ email: "", username: "", password: "" });
      setShowAddAdmin(false);
      fetchCustomers();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="font-display text-2xl font-bold">Customers</h2>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowRegister(!showRegister)} className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-xs">
            <UserPlus className="w-3.5 h-3.5" /> Register Client
          </button>
          <button onClick={() => setShowAddAdmin(!showAddAdmin)} className="flex items-center gap-1 bg-accent text-accent-foreground px-3 py-2 rounded-md text-xs">
            <Shield className="w-3.5 h-3.5" /> Add Admin
          </button>
          <button onClick={fetchCustomers} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-medium">{selectedIds.size} user(s) selected</span>
          <div className="flex gap-2">
            <button onClick={handleBulkCredit} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-md text-xs">
              <CheckCircle className="w-3 h-3" /> Credit Balance
            </button>
            <button onClick={handleBulkDelete} className="flex items-center gap-1 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md text-xs">
              <Trash2 className="w-3 h-3" /> Delete Selected
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <h3 className="font-medium text-sm">Register New Client</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Email" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
            <Input placeholder="Username" value={regForm.username} onChange={(e) => setRegForm({ ...regForm, username: e.target.value })} />
            <Input placeholder="Password" type="password" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleRegisterClient} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">Register</button>
            <button onClick={() => setShowRegister(false)} className="bg-secondary px-4 py-2 rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      {showAddAdmin && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 space-y-3">
          <h3 className="font-medium text-sm">Create New Admin</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
            <Input placeholder="Username" value={adminForm.username} onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })} />
            <Input placeholder="Password" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddAdmin} className="bg-accent text-accent-foreground px-4 py-2 rounded-md text-sm">Create Admin</button>
            <button onClick={() => setShowAddAdmin(false)} className="bg-secondary px-4 py-2 rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex items-center bg-secondary rounded-md px-3 py-2 mb-4">
        <Search className="w-4 h-4 text-muted-foreground mr-2" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by username or ID..." className="bg-transparent text-sm outline-none flex-1" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <button onClick={toggleSelectAll} className="p-1">
                  {selectedIds.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                </button>
              </TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="hidden md:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Country</TableHead>
              <TableHead className="hidden lg:table-cell">Wagered</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className={selectedIds.has(c.user_id) ? "bg-primary/5" : ""}>
                  <TableCell>
                    <button onClick={() => toggleSelect(c.user_id)} className="p-1">
                      {selectedIds.has(c.user_id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{c.username}</TableCell>
                  <TableCell>{c.currency || "KES"} {Number(c.balance).toFixed(2)}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{c.phone || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{c.country || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell">${Number(c.total_wagered).toFixed(2)}</TableCell>
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
