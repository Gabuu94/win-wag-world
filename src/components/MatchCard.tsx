import { NormalizedMatch } from "@/hooks/useOdds";
import OddsButton from "./OddsButton";
import { useNavigate } from "react-router-dom";
import { Clock, Radio } from "lucide-react";

interface MatchCardProps {
  match: NormalizedMatch;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const navigate = useNavigate();
  const { matchId, league, team1, team2, time, isLive, odds, localTime, providerTime, gameState } = match;
  const matchLabel = `${team1} vs ${team2}`;
  const hasDrawOdds = odds.draw > 0;
  const homeScore = gameState?.home_score;
  const awayScore = gameState?.away_score;

  return (
    <div
      className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition cursor-pointer group"
      onClick={() => navigate(`/match/${matchId}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate max-w-[60%]">{league}</span>
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <span className="flex items-center gap-1 bg-destructive/10 px-1.5 py-0.5 rounded" title={providerTime}>
              <Radio className="w-3 h-3 text-live animate-pulse" />
              <span className="text-[10px] font-bold text-live">{time}</span>
            </span>
          ) : (
            <span className="flex flex-col items-end text-muted-foreground" title={`Provider: ${providerTime}`}>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-medium">{time}</span>
              </span>
              <span className="text-[9px] opacity-75 leading-none mt-0.5">{localTime}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{team1}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{team2}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <OddsButton label="1" odds={odds.home} selectionId={`${matchId}-home`} matchLabel={matchLabel} pick={`${team1} Win`} />
        {hasDrawOdds && (
          <OddsButton label="X" odds={odds.draw} selectionId={`${matchId}-draw`} matchLabel={matchLabel} pick="Draw" />
        )}
        <OddsButton label="2" odds={odds.away} selectionId={`${matchId}-away`} matchLabel={matchLabel} pick={`${team2} Win`} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/match/${matchId}`);
          }}
          className="ml-auto text-xs text-muted-foreground hover:text-primary transition"
        >
          +{match.totalMarkets} markets
        </button>
      </div>
    </div>
  );
};

export default MatchCard;
