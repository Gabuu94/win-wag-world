import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useOdds } from "@/hooks/useOdds";
import OddsButton from "@/components/OddsButton";
import TopBar from "@/components/TopBar";
import BettingSlip from "@/components/BettingSlip";

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { matches, loading } = useOdds("upcoming");

  const match = matches.find((m) => m.matchId === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold mb-2">Match Not Found</h2>
            <button onClick={() => navigate("/")} className="text-primary hover:underline text-sm">
              ← Back to matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  const matchLabel = `${match.team1} vs ${match.team2}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 h-[calc(100vh-8rem)]">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to matches
          </button>

          <div className="bg-card border border-border rounded-lg p-6 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{match.league}</span>
              {match.isLive && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-live live-pulse" />
                  <span className="text-[10px] font-bold text-live">LIVE</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-center flex-1">
                <h2 className="font-display text-xl md:text-2xl font-bold">{match.team1}</h2>
              </div>
              <div className="px-6 text-center">
                <div className="text-muted-foreground text-sm">{match.time}</div>
              </div>
              <div className="text-center flex-1">
                <h2 className="font-display text-xl md:text-2xl font-bold">{match.team2}</h2>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-center">
              <OddsButton label={`1 – ${match.team1}`} odds={match.odds.home} selectionId={`${match.matchId}-home`} matchLabel={matchLabel} pick={`${match.team1} Win`} />
              <OddsButton label="X – Draw" odds={match.odds.draw} selectionId={`${match.matchId}-draw`} matchLabel={matchLabel} pick="Draw" />
              <OddsButton label={`2 – ${match.team2}`} odds={match.odds.away} selectionId={`${match.matchId}-away`} matchLabel={matchLabel} pick={`${match.team2} Win`} />
            </div>
          </div>
        </main>
        <BettingSlip />
      </div>
    </div>
  );
};

export default MatchDetail;
