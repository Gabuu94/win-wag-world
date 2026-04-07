import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Radio, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useOdds } from "@/hooks/useOdds";
import OddsButton from "@/components/OddsButton";
import TopBar from "@/components/TopBar";
import BettingSlip from "@/components/BettingSlip";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

interface AdminMarket {
  id: string;
  market_type: string;
  market_name: string;
  selections: { name: string; odds: number }[];
  is_active: boolean;
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
  const [adminMarkets, setAdminMarkets] = useState<AdminMarket[]>([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
  const [expandedMarkets, setExpandedMarkets] = useState<Set<string>>(new Set(["moneyline", "match_result"]));
  const [liveGame, setLiveGame] = useState<any>(null);

  const match = allMatches.find((m) => m.matchId === id);
  const isAdminGame = id?.startsWith("admin-");
  const adminGameId = isAdminGame ? id?.replace("admin-", "") : null;

  // Fetch admin game markets
  useEffect(() => {
    if (!adminGameId) return;
    const fetchAdminMarkets = async () => {
      setMarketsLoading(true);
      const { data } = await supabase.from("admin_game_markets").select("*").eq("game_id", adminGameId).eq("is_active", true);
      setAdminMarkets((data as unknown as AdminMarket[]) || []);
      // Get live game data
      const { data: game } = await supabase.from("admin_games").select("*").eq("id", adminGameId).single();
      if (game) setLiveGame(game);
      setMarketsLoading(false);
    };
    fetchAdminMarkets();

    // Subscribe to realtime updates
    const channel = supabase.channel(`game-${adminGameId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "admin_games", filter: `id=eq.${adminGameId}` }, (payload) => {
        setLiveGame(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [adminGameId]);

  // Fetch external markets
  useEffect(() => {
    if (!id || isAdminGame) return;
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
      } catch { /* silently fail */ }
      finally { setMarketsLoading(false); }
    };
    fetchMarkets();
  }, [id, isAdminGame]);

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

  // Live score display for admin games
  const showLiveScore = isAdminGame && liveGame && (liveGame.status === "live" || liveGame.status === "finished");
  const periodLabels: Record<string, string> = {
    not_started: "Not Started",
    first_half: "1st Half",
    half_time: "Half Time",
    second_half: "2nd Half",
    extra_time: "Extra Time",
    penalties: "Penalties",
    full_time: "Full Time",
    q1: "Q1", q2: "Q2", q3: "Q3", q4: "Q4",
    overtime: "Overtime",
  };

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
              {match.isLive || (liveGame?.status === "live") ? (
                <span className="flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded">
                  <Radio className="w-3 h-3 text-live animate-pulse" />
                  <span className="text-[10px] font-bold text-live">LIVE</span>
                </span>
              ) : liveGame?.status === "finished" ? (
                <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded">FINISHED</span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px]">{match.time}</span>
                </span>
              )}
            </div>

            {/* Live Score Board */}
            {showLiveScore && (
              <div className="mt-4 mb-2">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center flex-1">
                    <h2 className="font-display text-xl font-bold">{match.team1}</h2>
                  </div>
                  <div className="bg-secondary rounded-xl px-6 py-3 text-center">
                    <div className="font-display text-4xl font-bold text-primary">
                      {liveGame.result_home ?? 0} - {liveGame.result_away ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {periodLabels[liveGame.current_period] || liveGame.current_period}
                      {liveGame.status === "live" && liveGame.current_minute > 0 && ` · ${liveGame.current_minute}'`}
                    </div>
                    {liveGame.half_time_home != null && (
                      <div className="text-[10px] text-muted-foreground">HT: {liveGame.half_time_home} - {liveGame.half_time_away}</div>
                    )}
                  </div>
                  <div className="text-center flex-1">
                    <h2 className="font-display text-xl font-bold">{match.team2}</h2>
                  </div>
                </div>
                {/* Stats row */}
                {(liveGame.total_corners_home > 0 || liveGame.total_cards_home > 0 || liveGame.total_corners_away > 0 || liveGame.total_cards_away > 0) && (
                  <div className="flex justify-center gap-6 mt-3 text-xs text-muted-foreground">
                    <span>⛳ Corners: {liveGame.total_corners_home} - {liveGame.total_corners_away}</span>
                    <span>🟨 Cards: {liveGame.total_cards_home} - {liveGame.total_cards_away}</span>
                  </div>
                )}
              </div>
            )}

            {!showLiveScore && (
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
            )}

            {/* Main moneyline odds */}
            {liveGame?.status !== "finished" && (
              <div className="mt-6">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Match Result</h3>
                <div className="flex gap-3 justify-center flex-wrap">
                  <OddsButton label={`1 – ${match.team1}`} odds={match.odds.home} selectionId={`${match.matchId}-home`} matchLabel={matchLabel} pick={`${match.team1} Win`} />
                  {hasDrawOdds && (
                    <OddsButton label="X – Draw" odds={match.odds.draw} selectionId={`${match.matchId}-draw`} matchLabel={matchLabel} pick="Draw" />
                  )}
                  <OddsButton label={`2 – ${match.team2}`} odds={match.odds.away} selectionId={`${match.matchId}-away`} matchLabel={matchLabel} pick={`${match.team2} Win`} />
                </div>
              </div>
            )}
          </div>

          {/* Admin Game Markets */}
          {isAdminGame && adminMarkets.length > 0 && liveGame?.status !== "finished" && (
            <div className="space-y-2 mb-4">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">All Markets</h3>
              {adminMarkets.filter(m => m.market_type !== "match_result").map((market) => {
                const isExpanded = expandedMarkets.has(market.market_type);
                return (
                  <div key={market.id} className="bg-card border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleMarket(market.market_type)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-secondary/50 transition"
                    >
                      <span>{market.market_name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{market.selections.length} options</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="flex flex-wrap gap-2">
                          {market.selections.map((sel, idx) => (
                            <OddsButton
                              key={idx}
                              label={sel.name}
                              odds={sel.odds}
                              selectionId={`${match.matchId}-${market.market_type}-${sel.name}`}
                              matchLabel={matchLabel}
                              pick={sel.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* External Markets */}
          {marketsLoading && !isAdminGame && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Loading more markets...</span>
            </div>
          )}

          {!isAdminGame && marketKeys.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">More Markets</h3>
              {marketKeys.map((mkey) => {
                const odds = markets[mkey];
                const isExpanded = expandedMarkets.has(mkey);
                const label = MARKET_LABELS[mkey] || mkey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
                            {lineKey !== "main" && <p className="text-xs text-muted-foreground mb-1">Line: {lineKey}</p>}
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

          {liveGame?.status === "finished" && (
            <div className="bg-card border border-border rounded-lg p-6 text-center">
              <h3 className="font-display text-lg font-bold mb-2">Match Ended</h3>
              <p className="text-muted-foreground text-sm">Final Score: {liveGame.result_home} - {liveGame.result_away}</p>
              {liveGame.has_extra_time && liveGame.extra_time_result_home != null && (
                <p className="text-xs text-muted-foreground mt-1">After Extra Time: {liveGame.extra_time_result_home} - {liveGame.extra_time_result_away}</p>
              )}
              {liveGame.has_penalties && liveGame.penalty_home != null && (
                <p className="text-xs text-muted-foreground mt-1">Penalties: {liveGame.penalty_home} - {liveGame.penalty_away}</p>
              )}
            </div>
          )}
        </main>
        <BettingSlip />
      </div>
    </div>
  );
};

export default MatchDetail;
