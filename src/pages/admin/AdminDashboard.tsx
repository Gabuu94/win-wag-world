import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, Gamepad2, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, totalDeposits: 0, totalBets: 0, activeGames: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("transactions").select("amount").eq("type", "deposit").eq("status", "completed"),
      supabase.from("bets").select("id", { count: "exact", head: true }),
      supabase.from("admin_games").select("id", { count: "exact", head: true }).eq("is_published", true),
    ]).then(([usersRes, depositsRes, betsRes, gamesRes]) => {
      const totalDep = (depositsRes.data || []).reduce((s: number, d: any) => s + Number(d.amount), 0);
      setStats({
        users: usersRes.count || 0,
        totalDeposits: totalDep,
        totalBets: betsRes.count || 0,
        activeGames: gamesRes.count || 0,
      });
    });
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "text-blue-400" },
    { label: "Total Deposits", value: `$${stats.totalDeposits.toFixed(2)}`, icon: DollarSign, color: "text-green-400" },
    { label: "Total Bets", value: stats.totalBets, icon: TrendingUp, color: "text-yellow-400" },
    { label: "Active Games", value: stats.activeGames, icon: Gamepad2, color: "text-purple-400" },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
