import OddsButton from "./OddsButton";

interface MatchCardProps {
  league: string;
  team1: string;
  team2: string;
  score1?: number;
  score2?: number;
  time: string;
  isLive: boolean;
  odds: { home: number; draw: number; away: number };
}

const MatchCard = ({
  league,
  team1,
  team2,
  score1,
  score2,
  time,
  isLive,
  odds,
}: MatchCardProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition">
      {/* League & time */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {league}
        </span>
        <div className="flex items-center gap-1.5">
          {isLive && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-live live-pulse" />
              <span className="text-[10px] font-bold text-live">LIVE</span>
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">{time}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{team1}</span>
            {isLive && score1 !== undefined && (
              <span className="text-sm font-bold text-primary">{score1}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{team2}</span>
            {isLive && score2 !== undefined && (
              <span className="text-sm font-bold text-primary">{score2}</span>
            )}
          </div>
        </div>
      </div>

      {/* Odds */}
      <div className="flex gap-2">
        <OddsButton label="1" odds={odds.home} />
        <OddsButton label="X" odds={odds.draw} />
        <OddsButton label="2" odds={odds.away} />
        <button className="ml-auto text-xs text-muted-foreground hover:text-primary transition">
          +42
        </button>
      </div>
    </div>
  );
};

export default MatchCard;
