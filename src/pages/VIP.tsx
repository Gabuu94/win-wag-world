import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Star, Zap, Gift, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatMoney } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";

interface VipData {
  tier_name: string;
  tier_icon: string;
  tier_color: string;
  cashback_rate: number;
  bonus_multiplier: number;
  total_wagered: number;
  next_tier_name: string | null;
  next_tier_min: number | null;
}

interface TierInfo {
  id: number;
  name: string;
  min_wagered: number;
  cashback_rate: number;
  bonus_multiplier: number;
  icon: string;
  color: string;
}

const VIP = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, setShowAuthModal, profile } = useAuth();
  const [vipData, setVipData] = useState<VipData | null>(null);
  const [tiers, setTiers] = useState<TierInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: tiersData } = await supabase.from("vip_tiers").select("*").order("min_wagered", { ascending: true });
      if (tiersData) setTiers(tiersData as any);

      if (user) {
        const { data } = await supabase.rpc("get_user_vip_tier", { p_user_id: user.id });
        if (data && (data as any[]).length > 0) setVipData((data as any[])[0]);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Crown className="w-12 h-12 text-primary mx-auto mb-3" />
            <h2 className="font-display text-xl font-bold mb-2">VIP Program</h2>
            <p className="text-muted-foreground text-sm mb-4">Sign in to view your VIP status</p>
            <button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold text-sm">Sign In</button>
          </div>
        </div>
      </div>
    );
  }

  const progress = vipData && vipData.next_tier_min
    ? Math.min(100, (vipData.total_wagered / vipData.next_tier_min) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="font-display text-2xl font-bold mb-6 flex items-center gap-2">
          <Crown className="w-6 h-6 text-primary" /> VIP Program
        </h1>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : vipData ? (
          <>
            {/* Current Tier Card */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10 text-8xl flex items-center justify-center">{vipData.tier_icon}</div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Current Tier</p>
              <h2 className="text-3xl font-display font-bold mb-1" style={{ color: vipData.tier_color }}>{vipData.tier_icon} {vipData.tier_name}</h2>
              <p className="text-sm text-muted-foreground mb-4">Total wagered: <span className="font-bold text-foreground">{formatMoney(vipData.total_wagered, profile)}</span></p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold">{vipData.cashback_rate}%</p>
                  <p className="text-xs text-muted-foreground">Cashback</p>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <Gift className="w-4 h-4 text-accent mx-auto mb-1" />
                  <p className="text-lg font-bold">{vipData.bonus_multiplier}x</p>
                  <p className="text-xs text-muted-foreground">Bonus Multiplier</p>
                </div>
              </div>

              {vipData.next_tier_name && vipData.next_tier_min && (
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress to {vipData.next_tier_name}</span>
                    <span>${vipData.total_wagered.toFixed(0)} / ${vipData.next_tier_min.toFixed(0)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* All Tiers */}
            <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> All Tiers
            </h3>
            <div className="space-y-2">
              {tiers.map((tier) => {
                const isCurrent = tier.name === vipData.tier_name;
                return (
                  <div key={tier.id} className={`flex items-center gap-3 p-3 rounded-lg border transition ${isCurrent ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <span className="text-2xl">{tier.icon}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: tier.color }}>{tier.name}</p>
                      <p className="text-xs text-muted-foreground">Wager ${tier.min_wagered.toLocaleString()}+</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-primary font-medium">{tier.cashback_rate}% cashback</p>
                      <p className="text-muted-foreground">{tier.bonus_multiplier}x bonus</p>
                    </div>
                    {isCurrent && <Star className="w-4 h-4 text-primary" />}
                  </div>
                );
              })}
            </div>

            {/* Benefits */}
            <div className="mt-6 bg-card border border-border rounded-xl p-4">
              <h3 className="font-bold text-sm mb-3">VIP Benefits</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Gift className="w-3.5 h-3.5 text-primary" /> Cashback on all losses</li>
                <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" /> Bonus multiplier on deposits</li>
                <li className="flex items-center gap-2"><Crown className="w-3.5 h-3.5 text-primary" /> Exclusive promotions & events</li>
                <li className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-primary" /> Priority customer support</li>
              </ul>
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">Unable to load VIP data.</p>
        )}
      </main>
    </div>
  );
};

export default VIP;
