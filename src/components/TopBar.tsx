import { Search, Bell, Wallet, User, Menu } from "lucide-react";

const TopBar = () => {
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
          <h1 className="font-display text-2xl font-bold tracking-wider">
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
          <div className="hidden sm:flex items-center gap-2 bg-secondary rounded-md px-3 py-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">$0.00</span>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:brightness-110 transition">
            Deposit
          </button>
          <button className="hidden sm:flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
            <Bell className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sport tabs */}
      <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto border-t border-border">
        {["⚽ Football", "🏀 Basketball", "🎾 Tennis", "🏒 Hockey", "🥊 Boxing", "🏈 American Football", "⚾ Baseball", "🏐 Volleyball"].map(
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
