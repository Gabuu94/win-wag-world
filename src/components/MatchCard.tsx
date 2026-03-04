import { MatchData } from "@/data/matches";
import OddsButton from "./OddsButton";
import { useNavigate } from "react-router-dom";

interface MatchCardProps {
  match: MatchData;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const navigate = useNavigate();
  const { matchId, league, team1, team2, score1, score2, time, isLive, odds } = match;
  const matchLabel = `${team1} vs ${team2}`;

  return (
    <div
      className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition cursor-pointer"
      onClick={() => navigate(`/match/${matchId}`)}
    >
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

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <OddsButton label="1" odds={odds.home} selectionId={`${matchId}-home`} matchLabel={matchLabel} pick={`${team1} Win`} />
        <OddsButton label="X" odds={odds.draw} selectionId={`${matchId}-draw`} matchLabel={matchLabel} pick="Draw" />
        <OddsButton label="2" odds={odds.away} selectionId={`${matchId}-away`} matchLabel={matchLabel} pick={`${team2} Win`} />
        <button className="ml-auto text-xs text-muted-foreground hover:text-primary transition">
          +{match.totalMarkets || 42}
        </button>
      </div>
    </div>
  );
};

export default MatchCard;
