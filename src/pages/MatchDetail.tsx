import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Radio, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useOdds } from "@/hooks/useOdds";
import OddsButton from "@/components/OddsButton";
import TopBar from "@/components/TopBar";
import BettingSlip from "@/components/BettingSlip";
import { useState, useEffect } from "react";

interface MarketOdd {
  id: string;
  sportsbook: string;
  selection: string;
  selection_type: string;
  odds_decimal: number;
  odds_american: number;
  line: number | null;
  player_name?: string;
}

const MARKET_LABELS: Record<string, string> = {
  moneyline: "Match Result",
  point_spread: "Spread / Handicap",
  total_points: "Total Points",
  total_goals: "Total Goals",
  team_total: "Team Total",
  "1st_half_moneyline": "1st Half Result",
  "1st_half_point_spread": "1st Half Spread",
  "1st_half_total_points": "1st Half Total",
};

const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { matches: allMatches, loading } = useOdds("upcoming");
  const [markets, setMarkets] = useState<Record<string, MarketOdd[]>>({});
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [expandedMarkets, setExpandedMarkets] = useState<Set<string>>(new Set(["moneyline"]));

  const match = allMatches.find((m) => m.matchId === id);

  useEffect(() => {
    if (!id) return;
    const fetchMarkets = async () => {
      setMarketsLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const resp = await fetch(`${baseUrl}/functions/v1/fetch-match-markets?event_id=${id}`, {
          headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey },
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.markets) setMarkets(data.markets);
        }
      } catch {
        // silently fail, main odds are still shown
      } finally {
        setMarketsLoading(false);
      }
    };
    fetchMarkets();
  }, [id]);

  const toggleMarket = (key: string) => {
    setExpandedMarkets((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

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
            <button onClick={() => navigate("/")} className="text-primary hover:underline text-sm">← Back to matches</button>
          </div>
        </div>
      </div>
    );
  }

  const matchLabel = `${match.team1} vs ${match.team2}`;
  const hasDrawOdds = match.odds.draw > 0;
  const commenceDate = new Date(match.commenceTime);

  // Merge main moneyline odds from the match with additional markets
  const marketKeys = Object.keys(markets).filter((k) => k !== "moneyline");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 h-[calc(100vh-8rem)]">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4">
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
              {commenceDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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

            {/* Main moneyline odds */}
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
          </div>

          {/* Additional Markets */}
          {marketsLoading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Loading more markets...</span>
            </div>
          )}

          {marketKeys.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">More Markets</h3>
              {marketKeys.map((mkey) => {
                const odds = markets[mkey];
                const isExpanded = expandedMarkets.has(mkey);
                const label = MARKET_LABELS[mkey] || mkey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

                // Group by line for spread/total markets
                const groups: Record<string, MarketOdd[]> = {};
                for (const o of odds) {
                  const lineKey = o.line != null ? String(o.line) : "main";
                  if (!groups[lineKey]) groups[lineKey] = [];
                  groups[lineKey].push(o);
                }

                return (
                  <div key={mkey} className="bg-card border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleMarket(mkey)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-secondary/50 transition"
                    >
                      <span>{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{odds.length} options</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        {Object.entries(groups).map(([lineKey, lineOdds]) => (
                          <div key={lineKey} className="mb-2 last:mb-0">
                            {lineKey !== "main" && (
                              <p className="text-xs text-muted-foreground mb-1">Line: {lineKey}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {lineOdds.map((o) => (
                                <OddsButton
                                  key={o.id}
                                  label={o.player_name || o.selection}
                                  odds={o.odds_decimal}
                                  selectionId={`${match.matchId}-${mkey}-${o.selection}`}
                                  matchLabel={matchLabel}
                                  pick={`${o.selection}${o.line != null ? ` (${o.line > 0 ? "+" : ""}${o.line})` : ""}`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!marketsLoading && marketKeys.length === 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Odds from {match.totalMarkets} bookmaker{match.totalMarkets !== 1 ? "s" : ""} · Updates every 30s
              </p>
            </div>
          )}
        </main>
        <BettingSlip />
      </div>
    </div>
  );
};

export default MatchDetail;
