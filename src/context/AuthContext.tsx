import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendBrowserNotification, requestPushPermission } from "@/lib/pushNotifications";
import type { User, Session } from "@supabase/supabase-js";

export interface ProfileData {
  username: string;
  balance: number;
  winnings_balance: number;
  pending_fees: number;
  phone?: string;
  country?: string;
  currency?: string;
}

interface AuthContextType {
  user: User | null;
  profile: ProfileData | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (phoneOrEmail: string, password: string) => Promise<{ error?: string }>;
  signup: (username: string, phoneOrEmail: string, password: string, referralCode?: string, phone?: string, country?: string, currency?: string, recoveryEmail?: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  deposit: (amount: number) => Promise<boolean>;
  withdraw: (amount: number) => Promise<boolean>;
  placeBet: (bet: { selections: { matchLabel: string; pick: string; odds: number }[]; stake: number; totalOdds: number; potentialWin: number }) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
  showDepositModal: boolean;
  setShowDepositModal: (v: boolean) => void;
}

// Convert a phone-style identifier to a synthetic email used by Supabase auth.
// Accepts inputs like "+254797585941", "254797585941", "0797585941" with a country dial code.
export const phoneToSyntheticEmail = (fullPhoneE164: string) => {
  const digits = fullPhoneE164.replace(/\D/g, "");
  return `${digits}@betking.app`;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username, balance, winnings_balance, pending_fees, phone, country, currency")
      .eq("user_id", userId)
      .single();
    if (data) {
      setProfile({
        username: data.username,
        balance: Number(data.balance),
        winnings_balance: Number((data as any).winnings_balance ?? 0),
        pending_fees: Number((data as any).pending_fees ?? 0),
        phone: data.phone || undefined,
        country: data.country || undefined,
        currency: data.currency || undefined,
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  // Realtime profile balance updates + push notifications
  useEffect(() => {
    if (!user) return;

    // Request push permission on login
    requestPushPermission();

    const profileChannel = supabase
      .channel("profile-balance-realtime")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newData = payload.new as any;
        if (newData) {
          setProfile((prev) => prev ? {
            ...prev,
            balance: Number(newData.balance),
            winnings_balance: Number(newData.winnings_balance ?? prev.winnings_balance),
            pending_fees: Number(newData.pending_fees ?? prev.pending_fees),
          } : prev);
        }
      })
      .subscribe();

    // Listen for new notifications and send browser push
    const notifChannel = supabase
      .channel("notifications-push")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const n = payload.new as any;
        if (n) {
          sendBrowserNotification(n.title, n.message);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(notifChannel);
    };
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session: Session | null) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signup = useCallback(async (username: string, email: string, password: string, referralCode?: string, phone?: string, country?: string, currency?: string, recoveryEmail?: string) => {
    const metadata: Record<string, string> = { username };
    if (referralCode) metadata.referral_code = referralCode;
    if (phone) metadata.phone = phone;
    if (country) metadata.country = country;
    if (currency) metadata.currency = currency;
    if (recoveryEmail) metadata.recovery_email = recoveryEmail;
    
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) return { error: error.message };

    // Fire-and-forget welcome email — only if user supplied a recovery email
    if (recoveryEmail && signUpData?.user) {
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "welcome",
          recipientEmail: recoveryEmail,
          idempotencyKey: `welcome-${signUpData.user.id}`,
          templateData: {
            username,
            ctaUrl: "https://betking.space/?deposit=1",
          },
        },
      }).catch(() => {});
    }
    return {};
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const deposit = useCallback(async (amount: number) => {
    if (!user || !profile) return false;
    const newBalance = profile.balance + amount;
    const { error } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("user_id", user.id);
    if (error) return false;
    setProfile((prev) => prev ? { ...prev, balance: newBalance } : prev);
    return true;
  }, [user, profile]);

  const withdraw = useCallback(async (amount: number) => {
    if (!user || !profile) return false;
    // Admin exempt from balance check (used for game stakes)
    const { data: isAdminData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    const isAdmin = !!isAdminData;
    if (!isAdmin && profile.balance < amount) return false;
    const newBalance = profile.balance - amount;
    const { error } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("user_id", user.id);
    if (error) return false;
    setProfile((prev) => prev ? { ...prev, balance: newBalance } : prev);
    return true;
  }, [user, profile]);

  const placeBet = useCallback(async (bet: { selections: { matchLabel: string; pick: string; odds: number }[]; stake: number; totalOdds: number; potentialWin: number }) => {
    if (!user || !profile) return false;
    // Admins are exempt from balance/winnings restrictions
    const { data: isAdminData } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    const isAdmin = !!isAdminData;
    if (!isAdmin) {
      // Winnings cannot be wagered — only money from deposits is bettable.
      const bettable = Math.max(0, profile.balance - (profile.winnings_balance || 0));
      if (bettable < bet.stake) return false;
    }
    
    const newBalance = profile.balance - bet.stake;
    
    const { error: betError } = await supabase.from("bets").insert({
      user_id: user.id,
      selections: bet.selections as any,
      stake: bet.stake,
      total_odds: bet.totalOdds,
      potential_win: bet.potentialWin,
    });
    if (betError) return false;

    const { error: balError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("user_id", user.id);
    if (balError) return false;

    setProfile((prev) => prev ? { ...prev, balance: newBalance } : prev);
    return true;
  }, [user, profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoggedIn: !!user,
        loading,
        login,
        signup,
        logout,
        deposit,
        withdraw,
        placeBet,
        refreshProfile,
        showAuthModal,
        setShowAuthModal,
        showDepositModal,
        setShowDepositModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
