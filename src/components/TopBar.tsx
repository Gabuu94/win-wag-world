import { Search, Wallet, User, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserMenuDrawer from "./UserMenuDrawer";
import NotificationBell from "./NotificationBell";

const SPORT_TABS = [
  { key: "upcoming", label: "🔥 All" },
  { key: "soccer", label: "⚽ Football" },
  { key: "basketball_nba", label: "🏀 NBA" },
  { key: "icehockey_nhl", label: "🏒 Hockey" },
  { key: "mma_mixed_martial_arts", label: "🥊 MMA" },
  { key: "americanfootball_nfl", label: "🏈 NFL" },
  { key: "baseball_mlb", label: "⚾ MLB" },
  { key: "tennis_atp_french_open", label: "🎾 Tennis" },
  { key: "boxing_boxing", label: "🥊 Boxing" },
  { key: "cricket_test_match", label: "🏏 Cricket" },
];

interface TopBarProps {
  activeSport?: string;
  onSportChange?: (sport: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const TopBar = ({ activeSport = "upcoming", onSportChange, searchQuery = "", onSearchChange }: TopBarProps) => {
  const { profile, isLoggedIn, setShowAuthModal, setShowDepositModal } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const navigate = useNavigate();

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    onSearchChange?.(val);
  };

  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-wider cursor-pointer" onClick={() => navigate("/")}>
              <span className="text-primary">BET</span>
              <span className="text-accent">KING</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center bg-secondary rounded-md px-3 py-2 w-80">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search events, teams, leagues..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
            {localSearch && (
              <button onClick={() => handleSearchChange("")} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileSearch((v) => !v)}
              className="md:hidden text-muted-foreground hover:text-foreground transition"
            >
              <Search className="w-5 h-5" />
            </button>

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

            <NotificationBell />

            <button
              onClick={() => {
                if (!isLoggedIn) setShowAuthModal(true);
                else setMenuOpen(true);
              }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
            >
              {isLoggedIn ? <Menu className="w-5 h-5" /> : <User className="w-5 h-5" />}
              {isLoggedIn && profile && (
                <span className="hidden sm:inline text-xs font-medium text-foreground">
                  {profile.username}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {showMobileSearch && (
          <div className="md:hidden flex items-center bg-secondary px-4 py-2 border-t border-border gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search events, teams..."
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
              autoFocus
            />
            {localSearch && (
              <button onClick={() => handleSearchChange("")} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={() => { setShowMobileSearch(false); handleSearchChange(""); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
        )}

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

      <UserMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default TopBar;
