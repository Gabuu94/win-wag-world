import { X, Trash2 } from "lucide-react";

const sampleBets = [
  { match: "Barcelona vs PSG", pick: "Barcelona Win", odds: 2.1 },
  { match: "Man City vs Real Madrid", pick: "Over 2.5 Goals", odds: 1.85 },
];

const BettingSlip = () => {
  const totalOdds = sampleBets.reduce((acc, b) => acc * b.odds, 1);

  return (
    <aside className="hidden xl:flex flex-col w-72 bg-card border-l border-border h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider">
          Bet Slip
        </h3>
        <div className="flex items-center gap-2">
          <span className="bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {sampleBets.length}
          </span>
          <button className="text-muted-foreground hover:text-destructive transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {["Single", "Accumulator", "System"].map((tab, i) => (
          <button
            key={tab}
            className={`flex-1 py-2 text-xs font-medium transition ${
              i === 1
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bets */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sampleBets.map((bet, i) => (
          <div
            key={i}
            className="bg-secondary rounded-md p-3 relative"
          >
            <button className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition">
              <X className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] text-muted-foreground mb-1">{bet.match}</p>
            <p className="text-sm font-medium mb-1">{bet.pick}</p>
            <span className="text-primary font-bold text-sm">
              {bet.odds.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Odds</span>
          <span className="font-bold text-primary">{totalOdds.toFixed(2)}</span>
        </div>

        <div className="flex items-center bg-secondary rounded-md overflow-hidden">
          <span className="text-xs text-muted-foreground px-3">$</span>
          <input
            type="number"
            defaultValue={10}
            className="bg-transparent text-sm font-medium text-foreground py-2 outline-none w-full"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Potential Win</span>
          <span className="font-bold text-accent">
            ${(10 * totalOdds).toFixed(2)}
          </span>
        </div>

        <button className="w-full bg-primary text-primary-foreground py-3 rounded-md font-display font-bold text-sm uppercase tracking-wider hover:brightness-110 transition glow-green">
          Place Bet
        </button>
      </div>
    </aside>
  );
};

export default BettingSlip;
