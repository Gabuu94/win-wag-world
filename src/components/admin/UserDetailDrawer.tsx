import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Loader2, User, Wallet, Trophy, ArrowDownToLine, ArrowUpFromLine, History, Mail, Phone, MapPin, ShieldCheck, CreditCard, KeyRound, Send, Flag, FlagOff } from "lucide-react";
import { toast } from "sonner";

interface Props {
  userId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface ProfileFull {
  username: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  currency?: string | null;
  balance: number;
  winnings_balance: number;
  pending_fees: number;
  total_wagered: number;
  referral_code?: string | null;
  is_flagged?: boolean;
  flag_reason?: string | null;
  flagged_at?: string | null;
  created_at: string;
}

const fmt = (n: number, cur = "KES") => `${cur} ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const UserDetailDrawer = ({ userId, open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [bets, setBets] = useState<any[]>([]);
  const [txns, setTxns] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadUser = async () => {
    if (!userId) return;
    setLoading(true);
    const [p, b, t, w, r, l] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("bets").select("*").eq("user_id", userId).order("placed_at", { ascending: false }).limit(25),
      supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(25),
      supabase.from("withdrawal_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("admin_action_logs").select("*").eq("target_user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);
    setProfile((p.data as any) || null);
    setBets(b.data || []);
    setTxns(t.data || []);
    setWithdrawals(w.data || []);
    setRoles(((r.data as any[]) || []).map((x) => x.role));
    setLogs(l.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      await loadUser();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [open, userId]);

  const callAdminAction = async (action: string, payload: Record<string, any> = {}) => {
    if (!userId) return;
    setBusyAction(action);
    try {
      const { data, error } = await supabase.functions.invoke("admin-action", {
        body: { action, target_user_id: userId, ...payload },
      });
      if (error || !(data as any)?.success) throw new Error((data as any)?.error || error?.message || "Action failed");
      toast.success("Action completed");
      await loadUser();
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    } finally {
      setBusyAction(null);
    }
  };

  const adjustBalance = () => {
    const amount = prompt("Enter amount to add or subtract. Use a minus sign to debit, e.g. -500");
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) === 0) return;
    const reason = prompt("Reason for this balance adjustment:") || "Admin balance adjustment";
    callAdminAction("adjust_balance", { amount: Number(amount), reason });
  };

  const toggleFlag = () => {
    if (profile?.is_flagged) return callAdminAction("flag_account", { flagged: false, reason: "Flag cleared" });
    const reason = prompt("Why should this account be flagged?");
    if (!reason?.trim()) return;
    callAdminAction("flag_account", { flagged: true, reason: reason.trim() });
  };

  const cur = profile?.currency || "KES";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-4 h-4" /> User Details
          </SheetTitle>
          <SheetDescription>Full overview — balances, history & activity</SheetDescription>
        </SheetHeader>

        {loading || !profile ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Identity */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">{profile.username}</h3>
                <div className="flex items-center gap-1">
                  {profile.is_flagged && (
                    <span className="flex items-center gap-1 text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded uppercase font-bold">
                      <Flag className="w-3 h-3" /> Flagged
                    </span>
                  )}
                  {roles.includes("admin") && (
                    <span className="flex items-center gap-1 text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded uppercase font-bold">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                {profile.email && <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {profile.email}</p>}
                {profile.phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {profile.phone}</p>}
                {profile.country && <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {profile.country} • {cur}</p>}
                <p className="text-[10px] opacity-70">Joined {new Date(profile.created_at).toLocaleString()}</p>
                {profile.referral_code && <p className="text-[10px]">Referral: <span className="font-mono">{profile.referral_code}</span></p>}
                {profile.is_flagged && profile.flag_reason && <p className="text-[10px] text-destructive">Flag reason: {profile.flag_reason}</p>}
                <p className="text-[10px] font-mono opacity-60 break-all">{userId}</p>
              </div>
            </div>

            <Section title="Quick Actions" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              <div className="grid grid-cols-2 gap-2">
                <ActionButton busy={busyAction === "adjust_balance"} onClick={adjustBalance} icon={<CreditCard className="w-3.5 h-3.5" />} label="Adjust Balance" />
                <ActionButton busy={busyAction === "resend_password_reset"} onClick={() => callAdminAction("resend_password_reset")} icon={<KeyRound className="w-3.5 h-3.5" />} label="Send Reset" />
                <ActionButton busy={busyAction === "resend_activation"} onClick={() => callAdminAction("resend_activation")} icon={<Send className="w-3.5 h-3.5" />} label="Send Activation" />
                <ActionButton busy={busyAction === "flag_account"} onClick={toggleFlag} icon={profile.is_flagged ? <FlagOff className="w-3.5 h-3.5" /> : <Flag className="w-3.5 h-3.5" />} label={profile.is_flagged ? "Clear Flag" : "Flag Account"} />
              </div>
              {!profile.email && <p className="text-[10px] text-muted-foreground mt-2">Reset and activation emails require a saved recovery email.</p>}
            </Section>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><Wallet className="w-3 h-3" /> Balance</p>
                <p className="font-bold text-lg text-primary">{fmt(profile.balance, cur)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-[10px] uppercase text-muted-foreground flex items-center gap-1"><Trophy className="w-3 h-3" /> Winnings (locked)</p>
                <p className="font-bold text-lg text-accent">{fmt(profile.winnings_balance, cur)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Pending Fees</p>
                <p className="font-bold text-base">{fmt(profile.pending_fees, cur)}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Total Wagered</p>
                <p className="font-bold text-base">{fmt(profile.total_wagered, cur)}</p>
              </div>
            </div>

            {/* Withdrawal requests */}
            <Section title="Recent Withdrawals" icon={<ArrowUpFromLine className="w-3.5 h-3.5" />}>
              {withdrawals.length === 0 ? <Empty /> : withdrawals.map((w) => (
                <Row key={w.id}
                  left={<><span className="font-medium">{fmt(Number(w.amount), cur)}</span><span className="text-[10px] text-muted-foreground"> to {w.mpesa_phone}</span></>}
                  right={<StatusPill status={w.status} />}
                  sub={`Tax ${w.tax_paid ? "✓" : "✗"} • Agent ${w.agent_paid ? "✓" : "✗"} • ${new Date(w.created_at).toLocaleDateString()}`}
                />
              ))}
            </Section>

            {/* Transactions */}
            <Section title="Transactions" icon={<History className="w-3.5 h-3.5" />}>
              {txns.length === 0 ? <Empty /> : txns.map((t) => (
                <Row key={t.id}
                  left={<><span className="font-medium">{t.type}</span><span className="text-[10px] text-muted-foreground"> · {t.method}</span></>}
                  right={<span className={t.type === "deposit" ? "text-primary font-bold" : "text-accent font-bold"}>{fmt(Number(t.amount), cur)}</span>}
                  sub={`${t.status} • ${new Date(t.created_at).toLocaleString()}`}
                />
              ))}
            </Section>

            {/* Bets */}
            <Section title="Recent Bets" icon={<ArrowDownToLine className="w-3.5 h-3.5" />}>
              {bets.length === 0 ? <Empty /> : bets.map((b) => {
                const sels = Array.isArray(b.selections) ? b.selections : [];
                return (
                  <Row key={b.id}
                    left={<><span className="font-medium">{fmt(Number(b.stake), cur)}</span><span className="text-[10px] text-muted-foreground"> · {sels.length} sel · @{Number(b.total_odds).toFixed(2)}</span></>}
                    right={<StatusPill status={b.status} />}
                    sub={`Win: ${fmt(Number(b.potential_win), cur)} • ${new Date(b.placed_at).toLocaleString()}`}
                  />
                );
              })}
            </Section>

            <Section title="Admin Action Log" icon={<History className="w-3.5 h-3.5" />}>
              {logs.length === 0 ? <Empty /> : logs.map((log) => (
                <Row key={log.id}
                  left={<span className="font-medium">{String(log.action).replaceAll("_", " ")}</span>}
                  right={log.amount ? <span className="font-bold">{fmt(Number(log.amount), cur)}</span> : <span />}
                  sub={`${log.reason || "No reason"} • ${new Date(log.created_at).toLocaleString()}`}
                />
              ))}
            </Section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-lg p-3">
    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">{icon} {title}</h4>
    <div className="space-y-1.5 max-h-64 overflow-y-auto">{children}</div>
  </div>
);

const Row = ({ left, right, sub }: { left: React.ReactNode; right: React.ReactNode; sub?: string }) => (
  <div className="flex flex-col bg-secondary/40 rounded-md px-2.5 py-1.5">
    <div className="flex items-center justify-between text-xs"><div>{left}</div><div>{right}</div></div>
    {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);

const Empty = () => <p className="text-xs text-muted-foreground italic">None yet</p>;

const ActionButton = ({ busy, onClick, icon, label }: { busy: boolean; onClick: () => void; icon: React.ReactNode; label: string }) => (
  <button
    type="button"
    disabled={busy}
    onClick={onClick}
    className="flex items-center justify-center gap-1.5 bg-secondary text-foreground rounded-md px-2 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
  >
    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
    {label}
  </button>
);

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    won: "bg-primary/20 text-primary",
    lost: "bg-destructive/20 text-destructive",
    pending: "bg-accent/20 text-accent",
    completed: "bg-primary/20 text-primary",
    processing: "bg-accent/20 text-accent",
    awaiting_tax: "bg-accent/20 text-accent",
    awaiting_agent: "bg-accent/20 text-accent",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${map[status] || "bg-muted text-muted-foreground"}`}>{status}</span>;
};

export default UserDetailDrawer;
