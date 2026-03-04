import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

export interface UserData {
  id: string;
  username: string;
  email: string;
  balance: number;
  betHistory: PlacedBet[];
}

export interface PlacedBet {
  id: string;
  selections: { matchLabel: string; pick: string; odds: number }[];
  stake: number;
  totalOdds: number;
  potentialWin: number;
  status: "pending" | "won" | "lost";
  placedAt: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => boolean;
  signup: (username: string, email: string, password: string) => boolean;
  logout: () => void;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => boolean;
  placeBet: (bet: Omit<PlacedBet, "id" | "status" | "placedAt">) => boolean;
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

const USERS_KEY = "betking_users";
const CURRENT_USER_KEY = "betking_current_user";

function getStoredUsers(): Record<string, { password: string; data: UserData }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch { return {}; }
}

function saveUsers(users: Record<string, { password: string; data: UserData }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      const users = getStoredUsers();
      if (users[user.email]) {
        users[user.email].data = user;
        saveUsers(users);
      }
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [user]);

  const login = useCallback((email: string, password: string) => {
    const users = getStoredUsers();
    const entry = users[email.toLowerCase()];
    if (!entry || entry.password !== password) return false;
    setUser(entry.data);
    return true;
  }, []);

  const signup = useCallback((username: string, email: string, password: string) => {
    const users = getStoredUsers();
    const key = email.toLowerCase();
    if (users[key]) return false;
    const newUser: UserData = {
      id: crypto.randomUUID(),
      username,
      email: key,
      balance: 0,
      betHistory: [],
    };
    users[key] = { password, data: newUser };
    saveUsers(users);
    setUser(newUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const deposit = useCallback((amount: number) => {
    setUser((prev) => prev ? { ...prev, balance: prev.balance + amount } : prev);
  }, []);

  const withdraw = useCallback((amount: number) => {
    let success = false;
    setUser((prev) => {
      if (!prev || prev.balance < amount) return prev;
      success = true;
      return { ...prev, balance: prev.balance - amount };
    });
    return success;
  }, []);

  const placeBet = useCallback((bet: Omit<PlacedBet, "id" | "status" | "placedAt">) => {
    let success = false;
    setUser((prev) => {
      if (!prev || prev.balance < bet.stake) return prev;
      success = true;
      const newBet: PlacedBet = {
        ...bet,
        id: crypto.randomUUID(),
        status: "pending",
        placedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        balance: prev.balance - bet.stake,
        betHistory: [newBet, ...prev.betHistory],
      };
    });
    return success;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, isLoggedIn: !!user,
        login, signup, logout,
        deposit, withdraw, placeBet,
        showAuthModal, setShowAuthModal,
        showDepositModal, setShowDepositModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
