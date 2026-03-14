import { Search, Bell, Wallet, User, Menu, LogOut, History } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SPORT_TABS = [
  { key: "upcoming", label: "⚽ Football" },
  { key: "basketball_nba", label: "🏀 Basketball" },
  { key: "tennis_atp_french_open", label: "🎾 Tennis" },
  { key: "icehockey_nhl", label: "🏒 Hockey" },
  { key: "mma_mixed_martial_arts", label: "🥊 MMA" },
  { key: "americanfootball_nfl", label: "🏈 NFL" },
  { key: "baseball_mlb", label: "⚾ Baseball" },
];

interface TopBarProps {
  activeSport?: string;
  onSportChange?: (sport: string) => void;
}

const TopBar = ({ activeSport = "upcoming", onSportChange }: TopBarProps) => {
  const { profile, isLoggedIn, logout, setShowAuthModal, setShowDepositModal } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 text-center">
        <span className="text-sm text-primary font-medium">
          🎁 Welcome Bonus — Get up to <span className="font-bold">$1500</span> on your first deposit!
        </span>
      </div>

      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-display text-2xl font-bold tracking-wider cursor-pointer" onClick={() => navigate("/")}>
            <span className="text-primary">BET</span>
            <span className="text-accent">KING</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center bg-secondary rounded-md px-3 py-2 w-80">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Search events, teams, leagues..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn && profile && (
            <div className="hidden sm:flex items-center gap-2 bg-secondary rounded-md px-3 py-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">${profile.balance.toFixed(2)}</span>
            </div>
          )}

          <button
            onClick={() => {
              if (!isLoggedIn) setShowAuthModal(true);
              else setShowDepositModal(true);
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:brightness-110 transition"
          >
            Deposit
          </button>

          <button className="hidden sm:flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
            <Bell className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                if (!isLoggedIn) setShowAuthModal(true);
                else setShowUserMenu(!showUserMenu);
              }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
            >
              <User className="w-5 h-5" />
              {isLoggedIn && profile && (
                <span className="hidden sm:inline text-xs font-medium text-foreground">
                  {profile.username}
                </span>
              )}
            </button>

            {showUserMenu && isLoggedIn && profile && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium">{profile.username}</p>
                  <p className="text-xs text-primary font-bold mt-1">
                    Balance: ${profile.balance.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => { navigate("/history"); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-foreground hover:bg-secondary transition"
                >
                  <History className="w-4 h-4" /> Bet History
                </button>
                <button
                  onClick={() => { setShowDepositModal(true); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-foreground hover:bg-secondary transition"
                >
                  <Wallet className="w-4 h-4" /> Deposit
                </button>
                <button
                  onClick={() => { logout(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-secondary transition"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-border">
        {SPORT_TABS.map((sport) => (
          <button
            key={sport.key}
            onClick={() => onSportChange?.(sport.key)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeSport === sport.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {sport.label}
          </button>
        ))}
      </div>
    </header>
  );
};

export default TopBar;
