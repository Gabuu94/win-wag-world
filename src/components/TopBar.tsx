import { Search, Bell, Wallet, User, Menu, LogOut, History } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const TopBar = () => {
  const { user, isLoggedIn, logout, setShowAuthModal, setShowDepositModal } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      {/* Top promo bar */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-1.5 text-center">
        <span className="text-sm text-primary font-medium">
          🎁 Welcome Bonus — Get up to <span className="font-bold">$1500</span> on your first deposit!
        </span>
      </div>

      {/* Main nav */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <h1
            className="font-display text-2xl font-bold tracking-wider cursor-pointer"
            onClick={() => navigate("/")}
          >
            <span className="text-primary">BET</span>
            <span className="text-accent">KING</span>
          </h1>
        </div>

        {/* Search */}
        <div className="hidden md:flex items-center bg-secondary rounded-md px-3 py-2 w-80">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input
            type="text"
            placeholder="Search events, teams, leagues..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <div className="hidden sm:flex items-center gap-2 bg-secondary rounded-md px-3 py-2">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">${user!.balance.toFixed(2)}</span>
            </div>
          )}

          <button
            onClick={() => {
              if (!isLoggedIn) {
                setShowAuthModal(true);
              } else {
                setShowDepositModal(true);
              }
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:brightness-110 transition"
          >
            Deposit
          </button>

          <button className="hidden sm:flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
            <Bell className="w-5 h-5" />
          </button>

          {/* User button */}
          <div className="relative">
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  setShowAuthModal(true);
                } else {
                  setShowUserMenu(!showUserMenu);
                }
              }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
            >
              <User className="w-5 h-5" />
              {isLoggedIn && (
                <span className="hidden sm:inline text-xs font-medium text-foreground">
                  {user!.username}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showUserMenu && isLoggedIn && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium">{user!.username}</p>
                  <p className="text-xs text-muted-foreground">{user!.email}</p>
                  <p className="text-xs text-primary font-bold mt-1">
                    Balance: ${user!.balance.toFixed(2)}
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

      {/* Sport tabs */}
      <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-border">
        {["⚽ Football", "🏀 Basketball", "🎾 Tennis", "🏒 Hockey", "🥊 Boxing/MMA", "🏈 American Football", "⚾ Baseball", "🏐 Volleyball"].map(
          (sport, i) => (
            <button
              key={sport}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium transition ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {sport}
            </button>
          )
        )}
      </div>
    </header>
  );
};

export default TopBar;
