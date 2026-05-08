import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Loader2, User, Wallet, Trophy, ArrowDownToLine, ArrowUpFromLine, History, Mail, Phone, MapPin, ShieldCheck } from "lucide-react";

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

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [p, b, t, w, r] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("bets").select("*").eq("user_id", userId).order("placed_at", { ascending: false }).limit(25),
        supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(25),
        supabase.from("withdrawal_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (cancelled) return;
      setProfile((p.data as any) || null);
      setBets(b.data || []);
      setTxns(t.data || []);
      setWithdrawals(w.data || []);
      setRoles(((r.data as any[]) || []).map((x) => x.role));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, userId]);

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
                {roles.includes("admin") && (
                  <span className="flex items-center gap-1 text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded uppercase font-bold">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                {profile.email && <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {profile.email}</p>}
                {profile.phone && <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {profile.phone}</p>}
                {profile.country && <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {profile.country} • {cur}</p>}
                <p className="text-[10px] opacity-70">Joined {new Date(profile.created_at).toLocaleString()}</p>
                {profile.referral_code && <p className="text-[10px]">Referral: <span className="font-mono">{profile.referral_code}</span></p>}
                <p className="text-[10px] font-mono opacity-60 break-all">{userId}</p>
              </div>
            </div>

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
