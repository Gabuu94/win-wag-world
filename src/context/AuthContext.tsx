import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface ProfileData {
  username: string;
  balance: number;
}

interface AuthContextType {
  user: User | null;
  profile: ProfileData | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (username: string, email: string, password: string) => Promise<{ error?: string }>;
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
      .select("username, balance")
      .eq("user_id", userId)
      .single();
    if (data) {
      setProfile({ username: data.username, balance: Number(data.balance) });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session: Session | null) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
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

  const signup = useCallback(async (username: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { error: error.message };
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
    if (!user || !profile || profile.balance < amount) return false;
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
    if (!user || !profile || profile.balance < bet.stake) return false;
    
    const newBalance = profile.balance - bet.stake;
    
    // Insert bet and update balance
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
