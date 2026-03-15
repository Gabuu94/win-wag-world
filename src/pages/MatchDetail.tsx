import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Radio } from "lucide-react";
import { useOdds } from "@/hooks/useOdds";
import OddsButton from "@/components/OddsButton";
import TopBar from "@/components/TopBar";
import BettingSlip from "@/components/BettingSlip";
import { Loader2 } from "lucide-react";

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Try multiple sport keys to find the match
  const { matches: allMatches, loading } = useOdds("upcoming");

  const match = allMatches.find((m) => m.matchId === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
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
            <p className="text-muted-foreground text-sm mb-4">This match may have ended or is no longer available.</p>
            <button onClick={() => navigate("/")} className="text-primary hover:underline text-sm">
              ← Back to matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  const matchLabel = `${match.team1} vs ${match.team2}`;
  const hasDrawOdds = match.odds.draw > 0;
  const commenceDate = new Date(match.commenceTime);

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
              {match.isLive ? (
                <span className="flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded">
                  <Radio className="w-3 h-3 text-live animate-pulse" />
                  <span className="text-[10px] font-bold text-live">LIVE</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px]">{match.time}</span>
                </span>
              )}
            </div>

            <div className="text-xs text-muted-foreground mt-1">
              {commenceDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="text-center flex-1">
                <h2 className="font-display text-xl md:text-2xl font-bold">{match.team1}</h2>
              </div>
              <div className="px-6 text-center">
                <div className="font-display text-3xl font-bold text-muted-foreground">VS</div>
              </div>
              <div className="text-center flex-1">
                <h2 className="font-display text-xl md:text-2xl font-bold">{match.team2}</h2>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Match Result</h3>
              <div className="flex gap-3 justify-center">
                <OddsButton label={`1 – ${match.team1}`} odds={match.odds.home} selectionId={`${match.matchId}-home`} matchLabel={matchLabel} pick={`${match.team1} Win`} />
                {hasDrawOdds && (
                  <OddsButton label="X – Draw" odds={match.odds.draw} selectionId={`${match.matchId}-draw`} matchLabel={matchLabel} pick="Draw" />
                )}
                <OddsButton label={`2 – ${match.team2}`} odds={match.odds.away} selectionId={`${match.matchId}-away`} matchLabel={matchLabel} pick={`${match.team2} Win`} />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Odds from {match.totalMarkets} bookmaker{match.totalMarkets !== 1 ? "s" : ""} · Updates every 30s
              </p>
            </div>
          </div>
        </main>
        <BettingSlip />
      </div>
    </div>
  );
};

export default MatchDetail;
