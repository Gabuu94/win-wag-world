import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, Gamepad2, TrendingUp, Activity, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

interface DailyRevenue {
  date: string;
  amount: number;
}

interface SportPopularity {
  sport: string;
  count: number;
}

interface BetTrend {
  date: string;
  bets: number;
  volume: number;
}

const CHART_COLORS = ["hsl(142, 71%, 45%)", "hsl(217, 91%, 60%)", "hsl(48, 96%, 53%)", "hsl(280, 67%, 60%)", "hsl(0, 84%, 60%)", "hsl(180, 70%, 45%)", "hsl(30, 90%, 55%)", "hsl(330, 70%, 55%)"];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, totalDeposits: 0, totalBets: 0, activeGames: 0, totalWagered: 0, pendingWithdrawals: 0 });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [sportPop, setSportPop] = useState<SportPopularity[]>([]);
  const [betTrends, setBetTrends] = useState<BetTrend[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [usersRes, depositsRes, betsRes, gamesRes, profilesRes, withdrawRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("amount, created_at").eq("type", "deposit").eq("status", "completed"),
        supabase.from("bets").select("id, stake, placed_at, selections", { count: "exact" }),
        supabase.from("admin_games").select("id, sport", { count: "exact" }).eq("is_published", true),
        supabase.from("profiles").select("total_wagered"),
        supabase.from("transactions").select("amount").eq("type", "withdrawal").eq("status", "pending"),
      ]);

      const totalDep = (depositsRes.data || []).reduce((s: number, d: any) => s + Number(d.amount), 0);
      const totalWagered = (profilesRes.data || []).reduce((s: number, p: any) => s + Number(p.total_wagered), 0);
      const pendingW = (withdrawRes.data || []).reduce((s: number, w: any) => s + Number(w.amount), 0);

      setStats({
        users: usersRes.count || 0,
        totalDeposits: totalDep,
        totalBets: betsRes.count || 0,
        activeGames: gamesRes.count || 0,
        totalWagered,
        pendingWithdrawals: pendingW,
      });

      // Daily revenue (last 14 days)
      const revenueMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        revenueMap[d.toISOString().slice(0, 10)] = 0;
      }
      (depositsRes.data || []).forEach((d: any) => {
        const day = d.created_at?.slice(0, 10);
        if (day && revenueMap[day] !== undefined) revenueMap[day] += Number(d.amount);
      });
      setDailyRevenue(Object.entries(revenueMap).map(([date, amount]) => ({ date: date.slice(5), amount })));

      // Sport popularity from games
      const sportCount: Record<string, number> = {};
      (gamesRes.data || []).forEach((g: any) => {
        sportCount[g.sport] = (sportCount[g.sport] || 0) + 1;
      });
      // Also count from bets selections
      (betsRes.data || []).forEach((b: any) => {
        const sels = b.selections as any[];
        sels?.forEach((s: any) => {
          const label = (s.matchLabel || "").toLowerCase();
          if (label) {
            const sport = label.includes("nba") ? "basketball" : label.includes("nfl") ? "americanfootball" : "football";
            sportCount[sport] = (sportCount[sport] || 0) + 1;
          }
        });
      });
      setSportPop(Object.entries(sportCount).map(([sport, count]) => ({ sport: sport.charAt(0).toUpperCase() + sport.slice(1), count })).sort((a, b) => b.count - a.count).slice(0, 8));

      // Bet trends (last 14 days)
      const trendMap: Record<string, { bets: number; volume: number }> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        trendMap[d.toISOString().slice(0, 10)] = { bets: 0, volume: 0 };
      }
      (betsRes.data || []).forEach((b: any) => {
        const day = b.placed_at?.slice(0, 10);
        if (day && trendMap[day]) {
          trendMap[day].bets++;
          trendMap[day].volume += Number(b.stake);
        }
      });
      setBetTrends(Object.entries(trendMap).map(([date, v]) => ({ date: date.slice(5), ...v })));

      // Recent users
      const { data: recent } = await supabase.from("profiles").select("username, created_at, balance, country").order("created_at", { ascending: false }).limit(5);
      setRecentUsers(recent || []);
    };

    fetchAll();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, bg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Total Deposits", value: `$${stats.totalDeposits.toFixed(0)}`, icon: DollarSign, bg: "bg-accent/10", iconColor: "text-accent" },
    { label: "Total Bets", value: stats.totalBets, icon: TrendingUp, bg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Active Games", value: stats.activeGames, icon: Gamepad2, bg: "bg-accent/10", iconColor: "text-accent" },
    { label: "Total Wagered", value: `$${stats.totalWagered.toFixed(0)}`, icon: Activity, bg: "bg-primary/10", iconColor: "text-primary" },
    { label: "Pending Withdrawals", value: `$${stats.pendingWithdrawals.toFixed(0)}`, icon: BarChart3, bg: "bg-destructive/10", iconColor: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Analytics Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs text-muted-foreground">{c.label}</span>
              <div className={`${c.bg} p-1.5 rounded-md`}>
                <c.icon className={`w-3.5 h-3.5 ${c.iconColor}`} />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Revenue */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold mb-4">Daily Revenue (14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="amount" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Betting Trends */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold mb-4">Betting Trends (14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={betTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="bets" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} name="Bets" />
              <Line yAxisId="right" type="monotone" dataKey="volume" stroke="hsl(48, 96%, 53%)" strokeWidth={2} dot={false} name="Volume ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Popular Sports */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold mb-4">Popular Sports</h3>
          {sportPop.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sportPop} dataKey="count" nameKey="sport" cx="50%" cy="50%" outerRadius={80} label={({ sport, percent }) => `${sport} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {sportPop.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-bold mb-4">Recent Registrations</h3>
          <div className="space-y-3">
            {recentUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{u.username}</p>
                  <p className="text-[10px] text-muted-foreground">{u.country || "KE"} · {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-medium">${Number(u.balance).toFixed(2)}</span>
              </div>
            ))}
            {recentUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No users yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
