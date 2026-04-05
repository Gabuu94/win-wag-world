import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import { Copy, Users, Gift, CheckCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ReferralData {
  id: string;
  referred_id: string;
  bonus_amount: number;
  status: string;
  created_at: string;
}

const Referral = () => {
  const { user, profile, isLoggedIn, setShowAuthModal } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("user_id", user.id)
        .single();

      if (profileData?.referral_code) {
        setReferralCode(profileData.referral_code);
      }

      const { data: refData } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (refData) setReferrals(refData);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied!");
  };

  const shareLink = () => {
    const url = `${window.location.origin}?ref=${referralCode}`;
    if (navigator.share) {
      navigator.share({ title: "Join BetKing!", text: `Use my referral code ${referralCode} and get a bonus!`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Referral link copied!");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <Users className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Sign in to access your referral program</p>
            <button onClick={() => setShowAuthModal(true)} className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-semibold">
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalEarned = referrals.filter(r => r.status === "completed").reduce((sum, r) => sum + r.bonus_amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wider">Bring a Friend</h1>

        {/* Referral Code Card */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-primary" />
            <div>
              <h2 className="font-bold text-lg">Earn $5 per referral!</h2>
              <p className="text-sm text-muted-foreground">Share your code and earn when friends sign up</p>
            </div>
          </div>

          <div className="bg-secondary rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Your Referral Code</p>
              <p className="font-display text-2xl font-bold tracking-widest text-primary">{referralCode || "..."}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={copyCode} className="bg-primary/10 text-primary p-2 rounded-md hover:bg-primary/20 transition">
                <Copy className="w-5 h-5" />
              </button>
              <button onClick={shareLink} className="bg-primary text-primary-foreground p-2 rounded-md hover:brightness-110 transition">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{referrals.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Friends Referred</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">${totalEarned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Earned</p>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-sm">Referral History</h3>
          </div>
          {referrals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No referrals yet. Share your code to start earning!
            </div>
          ) : (
            referrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Friend joined</p>
                    <p className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-primary">+${ref.bonus_amount}</span>
              </div>
            ))
          )}
        </div>

        {/* How it works */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h3 className="font-bold text-sm">How it works</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Share your unique referral code with friends</p>
            <p>2. They sign up using your code</p>
            <p>3. You both get a $5 bonus added to your balance</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referral;
