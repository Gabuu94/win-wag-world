import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Save, Users, DollarSign, Clock, Share2, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

const SPORTS = [
  { value: "football", label: "⚽ Football" },
  { value: "basketball", label: "🏀 Basketball (NBA)" },
  { value: "tennis", label: "🎾 Tennis" },
  { value: "mma", label: "🥊 MMA/UFC" },
  { value: "hockey", label: "🏒 Hockey" },
  { value: "baseball", label: "⚾ Baseball" },
  { value: "americanfootball", label: "🏈 American Football" },
  { value: "cricket", label: "🏏 Cricket" },
];

const FOOTBALL_MARKETS = [
  { type: "match_result", name: "Match Result (1X2)", selections: [{ name: "Home Win", odds: 1.5 }, { name: "Draw", odds: 3.5 }, { name: "Away Win", odds: 4.0 }] },
  { type: "btts", name: "Both Teams to Score", selections: [{ name: "Yes", odds: 1.7 }, { name: "No", odds: 2.1 }] },
  { type: "over_under_2_5", name: "Over/Under 2.5 Goals", selections: [{ name: "Over 2.5", odds: 1.8 }, { name: "Under 2.5", odds: 2.0 }] },
  { type: "over_under_1_5", name: "Over/Under 1.5 Goals", selections: [{ name: "Over 1.5", odds: 1.3 }, { name: "Under 1.5", odds: 3.2 }] },
  { type: "over_under_3_5", name: "Over/Under 3.5 Goals", selections: [{ name: "Over 3.5", odds: 2.1 }, { name: "Under 3.5", odds: 1.7 }] },
  { type: "double_chance", name: "Double Chance", selections: [{ name: "1X", odds: 1.15 }, { name: "12", odds: 1.2 }, { name: "X2", odds: 1.8 }] },
  { type: "first_half", name: "First Half Result", selections: [{ name: "Home", odds: 2.0 }, { name: "Draw", odds: 2.2 }, { name: "Away", odds: 4.5 }] },
  { type: "corners_total", name: "Total Corners Over/Under 9.5", selections: [{ name: "Over 9.5", odds: 1.85 }, { name: "Under 9.5", odds: 1.95 }] },
  { type: "cards_total", name: "Total Cards Over/Under 3.5", selections: [{ name: "Over 3.5", odds: 1.9 }, { name: "Under 3.5", odds: 1.9 }] },
  { type: "correct_score", name: "Correct Score", selections: [{ name: "1-0", odds: 7.0 }, { name: "2-0", odds: 9.0 }, { name: "2-1", odds: 8.5 }, { name: "1-1", odds: 5.5 }, { name: "0-0", odds: 8.0 }, { name: "0-1", odds: 8.5 }, { name: "0-2", odds: 12.0 }] },
  { type: "halftime_fulltime", name: "Halftime/Fulltime", selections: [{ name: "Home/Home", odds: 2.5 }, { name: "Home/Draw", odds: 12.0 }, { name: "Draw/Home", odds: 5.0 }, { name: "Draw/Draw", odds: 4.5 }, { name: "Away/Away", odds: 6.0 }] },
  { type: "first_goal", name: "First Goal Scorer Method", selections: [{ name: "Header", odds: 5.0 }, { name: "Shot", odds: 1.8 }, { name: "Penalty", odds: 6.0 }, { name: "Free Kick", odds: 12.0 }] },
  { type: "clean_sheet_home", name: "Home Clean Sheet", selections: [{ name: "Yes", odds: 2.2 }, { name: "No", odds: 1.6 }] },
  { type: "clean_sheet_away", name: "Away Clean Sheet", selections: [{ name: "Yes", odds: 3.0 }, { name: "No", odds: 1.35 }] },
  { type: "win_to_nil_home", name: "Home Win to Nil", selections: [{ name: "Yes", odds: 3.5 }, { name: "No", odds: 1.25 }] },
  { type: "penalty_awarded", name: "Penalty Awarded", selections: [{ name: "Yes", odds: 3.0 }, { name: "No", odds: 1.35 }] },
  { type: "red_card", name: "Red Card in Match", selections: [{ name: "Yes", odds: 4.0 }, { name: "No", odds: 1.2 }] },
  { type: "extra_time", name: "Extra Time", selections: [{ name: "Yes", odds: 5.0 }, { name: "No", odds: 1.1 }] },
];

const BASKETBALL_MARKETS = [
  { type: "match_winner", name: "Match Winner", selections: [{ name: "Home Win", odds: 1.8 }, { name: "Away Win", odds: 2.0 }] },
  { type: "total_points", name: "Total Points Over/Under 210.5", selections: [{ name: "Over", odds: 1.9 }, { name: "Under", odds: 1.9 }] },
  { type: "handicap", name: "Handicap (-5.5)", selections: [{ name: "Home +5.5", odds: 1.85 }, { name: "Away -5.5", odds: 1.95 }] },
  { type: "q1_winner", name: "1st Quarter Winner", selections: [{ name: "Home", odds: 1.9 }, { name: "Away", odds: 1.9 }] },
  { type: "q2_winner", name: "2nd Quarter Winner", selections: [{ name: "Home", odds: 1.9 }, { name: "Away", odds: 1.9 }] },
  { type: "q3_winner", name: "3rd Quarter Winner", selections: [{ name: "Home", odds: 1.9 }, { name: "Away", odds: 1.9 }] },
  { type: "q4_winner", name: "4th Quarter Winner", selections: [{ name: "Home", odds: 1.9 }, { name: "Away", odds: 1.9 }] },
  { type: "first_half_winner", name: "First Half Winner", selections: [{ name: "Home", odds: 1.85 }, { name: "Away", odds: 1.95 }] },
  { type: "overtime", name: "Will There Be Overtime?", selections: [{ name: "Yes", odds: 6.0 }, { name: "No", odds: 1.1 }] },
];

const DEFAULT_MARKETS: Record<string, typeof FOOTBALL_MARKETS> = {
  football: FOOTBALL_MARKETS,
  basketball: BASKETBALL_MARKETS,
  tennis: [
    { type: "match_winner", name: "Match Winner", selections: [{ name: "Player 1", odds: 1.7 }, { name: "Player 2", odds: 2.1 }] },
    { type: "total_sets", name: "Total Sets Over/Under 3.5", selections: [{ name: "Over", odds: 1.8 }, { name: "Under", odds: 2.0 }] },
    { type: "first_set", name: "First Set Winner", selections: [{ name: "Player 1", odds: 1.8 }, { name: "Player 2", odds: 2.0 }] },
  ],
  mma: [
    { type: "match_winner", name: "Fight Winner", selections: [{ name: "Fighter 1", odds: 1.6 }, { name: "Fighter 2", odds: 2.3 }] },
    { type: "method", name: "Method of Victory", selections: [{ name: "KO/TKO", odds: 2.2 }, { name: "Decision", odds: 2.8 }, { name: "Submission", odds: 4.5 }] },
    { type: "rounds", name: "Total Rounds Over/Under 2.5", selections: [{ name: "Over", odds: 1.7 }, { name: "Under", odds: 2.1 }] },
  ],
};

// Calculate end time from start time + sport duration + extra minutes
function calcEndTime(startTime: string, sport: string, extraMinutes: number, hasExtraTime: boolean): string {
  if (!startTime) return "";
  const start = new Date(startTime);
  let durationMins = 90; // football default (45+45)
  if (sport === "basketball") durationMins = 48;
  else if (sport === "tennis") durationMins = 120;
  else if (sport === "mma") durationMins = 25;
  else if (sport === "hockey") durationMins = 60;
  else if (sport === "baseball") durationMins = 180;
  else if (sport === "americanfootball") durationMins = 60;
  else if (sport === "cricket") durationMins = 240;

  // Add 15 min half-time for football, 20 min for basketball
  if (sport === "football") durationMins += 15;
  if (sport === "basketball") durationMins += 15;
  if (hasExtraTime && sport === "football") durationMins += 30;

  durationMins += extraMinutes;

  const end = new Date(start.getTime() + durationMins * 60000);
  // Return full ISO (with Z) so consumers parse it as UTC, not local time.
  return end.toISOString();
}

interface GameForm {
  sport: string;
  home_team: string;
  away_team: string;
  league: string;
  start_time: string;
  extra_minutes: number;
  has_extra_time: boolean;
  has_penalties: boolean;
  markets: { type: string; name: string; selections: { name: string; odds: number }[]; enabled: boolean }[];
}

interface GameStats {
  total_bets: number;
  total_staked: number;
}

const AdminGameCreator = () => {
  const [games, setGames] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [resultForm, setResultForm] = useState<Record<string, any>>({});
  const [gameStats, setGameStats] = useState<Record<string, GameStats>>({});

  const defaultForm: GameForm = {
    sport: "football",
    home_team: "",
    away_team: "",
    league: "",
    start_time: "",
    extra_minutes: 0,
    has_extra_time: false,
    has_penalties: false,
    markets: (DEFAULT_MARKETS["football"] || []).map((m) => ({ ...m, enabled: true })),
  };

  const [form, setForm] = useState<GameForm>(defaultForm);

  const fetchGames = async () => {
    const { data } = await supabase.from("admin_games").select("*").order("created_at", { ascending: false });
    const gamesData = (data as any[]) || [];
    setGames(gamesData);

    // Fetch bet stats for each game
    if (gamesData.length > 0) {
      const gameIds = gamesData.map(g => g.id);
      const { data: bets } = await supabase.from("bets").select("selections, stake");
      if (bets) {
        const stats: Record<string, GameStats> = {};
        gameIds.forEach(id => { stats[id] = { total_bets: 0, total_staked: 0 }; });
        bets.forEach((bet: any) => {
          const sels = bet.selections as any[];
          sels?.forEach((sel: any) => {
            const matchLabel = sel.matchLabel || "";
            gameIds.forEach(id => {
              const game = gamesData.find((g: any) => g.id === id);
              if (game && matchLabel.includes(game.home_team) && matchLabel.includes(game.away_team)) {
                stats[id].total_bets++;
                stats[id].total_staked += Number(bet.stake);
              }
            });
          });
        });
        setGameStats(stats);
      }
    }
  };

  useEffect(() => { fetchGames(); }, []);

  // Realtime updates for admin games
  useEffect(() => {
    const channel = supabase.channel("admin-games-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_games" }, () => fetchGames())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSportChange = (sport: string) => {
    const markets = (DEFAULT_MARKETS[sport] || DEFAULT_MARKETS["football"]).map((m) => ({ ...m, enabled: true }));
    setForm({ ...form, sport, markets });
  };

  const updateMarketOdds = (idx: number, selIdx: number, odds: number) => {
    const markets = [...form.markets];
    markets[idx].selections[selIdx].odds = odds;
    setForm({ ...form, markets });
  };

  const toggleMarket = (idx: number) => {
    const markets = [...form.markets];
    markets[idx].enabled = !markets[idx].enabled;
    setForm({ ...form, markets });
  };

  const addCustomSelection = (idx: number) => {
    const markets = [...form.markets];
    markets[idx].selections.push({ name: "New Option", odds: 2.0 });
    setForm({ ...form, markets });
  };

  const removeSelection = (mIdx: number, sIdx: number) => {
    const markets = [...form.markets];
    markets[mIdx].selections.splice(sIdx, 1);
    setForm({ ...form, markets });
  };

  const updateSelectionName = (mIdx: number, sIdx: number, name: string) => {
    const markets = [...form.markets];
    markets[mIdx].selections[sIdx].name = name;
    setForm({ ...form, markets });
  };

  // Convert "YYYY-MM-DDTHH:mm" (interpreted as Kenyan/EAT time, UTC+3) to a proper ISO string.
  // Kenya does not observe DST, so the offset is always +03:00.
  const toKenyaIso = (local: string): string => {
    if (!local) return "";
    // Append the EAT offset so Postgres stores the exact wall-clock time the admin picked.
    return new Date(`${local}:00+03:00`).toISOString();
  };

  const createGame = async () => {
    if (!form.home_team || !form.away_team || !form.start_time) {
      toast({ title: "Missing fields", description: "Fill in team names and start time", variant: "destructive" });
      return;
    }

    const startIso = toKenyaIso(form.start_time);
    const endTime = calcEndTime(startIso, form.sport, form.extra_minutes, form.has_extra_time);

    const { data: game, error: gameError } = await supabase.from("admin_games").insert({
      sport: form.sport,
      home_team: form.home_team,
      away_team: form.away_team,
      league: form.league || "Custom League",
      start_time: startIso,
      end_time: endTime || null,
      has_extra_time: form.has_extra_time,
      has_penalties: form.has_penalties,
    }).select().single();

    if (gameError || !game) { toast({ title: "Error", description: gameError?.message, variant: "destructive" }); return; }

    const enabledMarkets = form.markets.filter((m) => m.enabled);
    if (enabledMarkets.length > 0) {
      const marketRows = enabledMarkets.map((m) => ({
        game_id: game.id,
        market_type: m.type,
        market_name: m.name,
        selections: m.selections,
      }));
      await supabase.from("admin_game_markets").insert(marketRows);
    }

    toast({ title: "Game created!" });
    setShowForm(false);
    setForm(defaultForm);
    fetchGames();
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("admin_games").update({ is_published: !current }).eq("id", id);
    toast({ title: current ? "Game unpublished" : "Game published and live!" });
    fetchGames();
  };

  const deleteGame = async (id: string) => {
    if (!confirm("Delete this game?")) return;
    await supabase.from("admin_game_markets").delete().eq("game_id", id);
    await supabase.from("admin_games").delete().eq("id", id);
    fetchGames();
  };

  const updateGameResults = async (gameId: string) => {
    const r = resultForm[gameId] || {};
    const game = games.find(g => g.id === gameId);
    
    const updateData: any = {
      result_home: r.result_home ?? game?.result_home ?? null,
      result_away: r.result_away ?? game?.result_away ?? null,
      half_time_home: r.half_time_home ?? game?.half_time_home ?? null,
      half_time_away: r.half_time_away ?? game?.half_time_away ?? null,
      current_minute: r.current_minute ?? game?.current_minute ?? 0,
      current_period: r.current_period ?? game?.current_period ?? "not_started",
      status: r.status ?? game?.status ?? "upcoming",
      total_corners_home: r.total_corners_home ?? game?.total_corners_home ?? 0,
      total_corners_away: r.total_corners_away ?? game?.total_corners_away ?? 0,
      total_cards_home: r.total_cards_home ?? game?.total_cards_home ?? 0,
      total_cards_away: r.total_cards_away ?? game?.total_cards_away ?? 0,
      extra_time_result_home: r.extra_time_result_home ?? game?.extra_time_result_home ?? null,
      extra_time_result_away: r.extra_time_result_away ?? game?.extra_time_result_away ?? null,
      penalty_home: r.penalty_home ?? game?.penalty_home ?? null,
      penalty_away: r.penalty_away ?? game?.penalty_away ?? null,
    };
    
    await supabase.from("admin_games").update(updateData).eq("id", gameId);

    // If game is finished, settle bets
    if (updateData.status === "finished") {
      await settleBetsForGame(gameId, updateData, game);
    }

    toast({ title: "Results updated!" });
    fetchGames();
  };

  const settleBetsForGame = async (gameId: string, results: any, game: any) => {
    // Get all markets for this game
    const { data: markets } = await supabase.from("admin_game_markets").select("*").eq("game_id", gameId);
    if (!markets) return;

    // Get all pending bets
    const { data: allBets } = await supabase.from("bets").select("*").eq("status", "pending");
    if (!allBets) return;

    const matchLabel = `${game.home_team} vs ${game.away_team}`;
    const homeScore = Number(results.result_home ?? 0);
    const awayScore = Number(results.result_away ?? 0);
    const htHome = Number(results.half_time_home ?? 0);
    const htAway = Number(results.half_time_away ?? 0);
    // For "auto-pick" markets like corners/cards: if admin didn't enter values, pick a plausible random total
    const cornersEntered = (results.total_corners_home ?? 0) + (results.total_corners_away ?? 0) > 0;
    const cardsEntered = (results.total_cards_home ?? 0) + (results.total_cards_away ?? 0) > 0;
    const totalCorners = cornersEntered
      ? (Number(results.total_corners_home ?? 0) + Number(results.total_corners_away ?? 0))
      : Math.floor(6 + Math.random() * 8); // 6–13 typical
    const totalCards = cardsEntered
      ? (Number(results.total_cards_home ?? 0) + Number(results.total_cards_away ?? 0))
      : Math.floor(2 + Math.random() * 4); // 2–5 typical
    const totalGoals = homeScore + awayScore;

    // Build winning pick variants per market type. We include team-name aliases so picks like
    // "Barcelona Win" match "Home Win" outcomes.
    const homeName = String(game.home_team || "").trim();
    const awayName = String(game.away_team || "").trim();
    const winningPicks: Record<string, string[]> = {};

    markets.forEach((m: any) => {
      const wins: string[] = [];
      switch (m.market_type) {
        case "match_result":
        case "match_winner":
          if (homeScore > awayScore) wins.push("Home Win", "Home", `${homeName} Win`, homeName);
          else if (homeScore < awayScore) wins.push("Away Win", "Away", `${awayName} Win`, awayName);
          else wins.push("Draw");
          break;
        case "btts":
          wins.push(homeScore > 0 && awayScore > 0 ? "Yes" : "No");
          break;
        case "over_under_2_5":
          wins.push(totalGoals > 2.5 ? "Over 2.5" : "Under 2.5");
          break;
        case "over_under_1_5":
          wins.push(totalGoals > 1.5 ? "Over 1.5" : "Under 1.5");
          break;
        case "over_under_3_5":
          wins.push(totalGoals > 3.5 ? "Over 3.5" : "Under 3.5");
          break;
        case "double_chance":
          if (homeScore >= awayScore) wins.push("1X");
          if (homeScore !== awayScore) wins.push("12");
          if (awayScore >= homeScore) wins.push("X2");
          break;
        case "first_half":
          if (htHome > htAway) wins.push("Home", `${homeName} Win`, homeName);
          else if (htHome < htAway) wins.push("Away", `${awayName} Win`, awayName);
          else wins.push("Draw");
          break;
        case "corners_total":
          wins.push(totalCorners > 9.5 ? "Over 9.5" : "Under 9.5");
          break;
        case "cards_total":
          wins.push(totalCards > 3.5 ? "Over 3.5" : "Under 3.5");
          break;
        case "correct_score":
          // EXACT match — admin's entered score must equal one of the offered correct-score selections
          wins.push(`${homeScore}-${awayScore}`);
          break;
        case "halftime_fulltime": {
          const ht = htHome > htAway ? "Home" : htHome < htAway ? "Away" : "Draw";
          const ft = homeScore > awayScore ? "Home" : homeScore < awayScore ? "Away" : "Draw";
          wins.push(`${ht}/${ft}`);
          break;
        }
        case "clean_sheet_home":
          wins.push(awayScore === 0 ? "Yes" : "No");
          break;
        case "clean_sheet_away":
          wins.push(homeScore === 0 ? "Yes" : "No");
          break;
        case "win_to_nil_home":
          wins.push(homeScore > 0 && awayScore === 0 ? "Yes" : "No");
          break;
        case "extra_time":
          wins.push(game.has_extra_time && results.extra_time_result_home != null ? "Yes" : "No");
          break;
        default: {
          // Unknown / "any other" market — auto-pick: randomly select one of the offered selections
          const sels = (m.selections as any[]) || [];
          if (sels.length > 0) {
            const choice = sels[Math.floor(Math.random() * sels.length)];
            wins.push(String(choice.name));
          }
          break;
        }
      }
      winningPicks[m.market_type] = wins;
      // Persist the winning result on the market for future auditing
      void supabase.from("admin_game_markets").update({ result: wins.join(", ") || null }).eq("id", m.id);
    });

    // Helper: does this selection belong to this game?
    const selectionMatchesGame = (s: any): boolean => {
      const label = String(s.matchLabel || "");
      const id = String(s.id || "");
      // Selection IDs created from admin matches are prefixed with `admin-<gameId>-...`
      if (id.startsWith(`admin-${gameId}`)) return true;
      return label.includes(homeName) && label.includes(awayName);
    };

    // Helper: did this single selection win?
    const isWinningSelection = (s: any): boolean => {
      const pick = String(s.pick || "").trim();
      const pickLower = pick.toLowerCase();
      for (const wins of Object.values(winningPicks)) {
        for (const w of wins) {
          const wLower = w.toLowerCase();
          if (pickLower === wLower) return true;
          // permissive contains (handles "Over 2.5 Goals" vs "Over 2.5")
          if (pickLower.includes(wLower) || wLower.includes(pickLower)) return true;
        }
      }
      return false;
    };

    // Settle each bet that contains selections from this game
    for (const bet of allBets) {
      const sels = (bet.selections as any[]) || [];
      const matchedSels = sels.filter(selectionMatchesGame);
      if (matchedSels.length === 0) continue;

      const otherSels = sels.filter((s) => !selectionMatchesGame(s));

      // Only settle if all bet selections relate to this game (other-game legs settle separately)
      if (otherSels.length > 0) continue;

      const allWon = matchedSels.every(isWinningSelection);
      const newStatus = allWon ? "won" : "lost";
      await supabase.from("bets").update({ status: newStatus }).eq("id", bet.id);

      if (allWon) {
        const { data: profile } = await supabase.from("profiles").select("balance").eq("user_id", bet.user_id).single();
        if (profile) {
          await supabase.from("profiles").update({ balance: Number(profile.balance) + Number(bet.potential_win) }).eq("user_id", bet.user_id);
        }
        await supabase.from("notifications").insert({
          user_id: bet.user_id,
          title: "Bet Won! 🎉",
          message: `Your bet on ${matchLabel} won ${Number(bet.potential_win).toFixed(2)}!`,
          type: "win",
        });
      } else {
        await supabase.from("notifications").insert({
          user_id: bet.user_id,
          title: "Bet Lost",
          message: `Your bet on ${matchLabel} did not win. Better luck next time!`,
          type: "loss",
        });
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Game Manager</h2>
        <button onClick={() => { setShowForm(!showForm); setForm(defaultForm); }} className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm">
          <Plus className="w-4 h-4" /> Create Game
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-4">
          <h3 className="font-bold text-lg">New Game</h3>
          
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Sport</label>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => (
                <button key={s.value} onClick={() => handleSportChange(s.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium ${form.sport === s.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Home Team</label>
              <Input value={form.home_team} onChange={(e) => setForm({ ...form, home_team: e.target.value })} placeholder="e.g. GALA FC" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Away Team</label>
              <Input value={form.away_team} onChange={(e) => setForm({ ...form, away_team: e.target.value })} placeholder="e.g. TULA FC" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">League</label>
              <Input value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} placeholder="e.g. Premier League" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
              <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Extra Minutes (stoppage)</label>
              <Input type="number" value={form.extra_minutes} onChange={(e) => setForm({ ...form, extra_minutes: Number(e.target.value) })} placeholder="0" min={0} />
            </div>
          </div>

          {form.start_time && (
            <div className="bg-secondary/50 rounded-md p-3 space-y-1">
              <p className="text-xs text-muted-foreground">
                <Clock className="w-3 h-3 inline mr-1" />
                Start (Kenya/EAT): <strong>{new Date(toKenyaIso(form.start_time)).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                <Clock className="w-3 h-3 inline mr-1" />
                End (Kenya/EAT): <strong>{new Date(calcEndTime(toKenyaIso(form.start_time), form.sport, form.extra_minutes, form.has_extra_time)).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}</strong>
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.has_extra_time} onChange={(e) => setForm({ ...form, has_extra_time: e.target.checked })} className="rounded" />
              Extra Time Possible
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.has_penalties} onChange={(e) => setForm({ ...form, has_penalties: e.target.checked })} className="rounded" />
              Penalties Possible
            </label>
          </div>

          <div>
            <h4 className="font-medium text-sm mb-2">Betting Markets ({form.markets.filter(m => m.enabled).length} active)</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {form.markets.map((market, mIdx) => (
                <div key={mIdx} className={`border rounded-lg p-3 ${market.enabled ? "border-primary/30 bg-primary/5" : "border-border opacity-50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={market.enabled} onChange={() => toggleMarket(mIdx)} className="rounded" />
                      <span className="text-sm font-medium">{market.name}</span>
                    </label>
                  </div>
                  {market.enabled && (
                    <div className="space-y-1.5">
                      {market.selections.map((sel, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2">
                          <input value={sel.name} onChange={(e) => updateSelectionName(mIdx, sIdx, e.target.value)} className="flex-1 bg-secondary rounded px-2 py-1 text-xs outline-none" />
                          <input type="number" step="0.05" value={sel.odds} onChange={(e) => updateMarketOdds(mIdx, sIdx, Number(e.target.value))} className="w-20 bg-secondary rounded px-2 py-1 text-xs outline-none text-center" />
                          <button onClick={() => removeSelection(mIdx, sIdx)} className="text-destructive hover:bg-destructive/10 p-0.5 rounded"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ))}
                      <button onClick={() => addCustomSelection(mIdx)} className="text-xs text-primary hover:underline">+ Add option</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={createGame} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium">Create Game</button>
            <button onClick={() => setShowForm(false)} className="bg-secondary px-4 py-2 rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {games.map((g) => {
          const stats = gameStats[g.id] || { total_bets: 0, total_staked: 0 };
          return (
            <div key={g.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground uppercase">{g.sport} · {g.league}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${g.is_published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {g.is_published ? "Published" : "Draft"}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${g.status === "live" ? "bg-red-500/20 text-red-400" : g.status === "finished" ? "bg-blue-500/20 text-blue-400" : "bg-secondary"}`}>{g.status}</span>
                  </div>
                  <h3 className="font-bold">{g.home_team} vs {g.away_team}</h3>
                  <p className="text-xs text-muted-foreground">{new Date(g.start_time).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })} (EAT)</p>
                  {g.result_home !== null && <p className="text-sm font-medium text-primary mt-1">Score: {g.result_home} - {g.result_away}</p>}
                  {/* Betting stats */}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" /> {stats.total_bets} bets
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="w-3 h-3" /> ${stats.total_staked.toFixed(2)} staked
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => togglePublish(g.id, g.is_published)} className="p-2 rounded hover:bg-secondary" title={g.is_published ? "Unpublish" : "Publish"}>
                    {g.is_published ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-green-400" />}
                  </button>
                  <button onClick={() => setExpandedGame(expandedGame === g.id ? null : g.id)} className="p-2 rounded hover:bg-secondary">
                    {expandedGame === g.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteGame(g.id)} className="p-2 rounded hover:bg-destructive/10 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedGame === g.id && (
                <div className="border-t border-border p-4 space-y-4">
                  <h4 className="font-medium text-sm">Update Results & Status</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Status</label>
                      <select value={resultForm[g.id]?.status ?? g.status} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], status: e.target.value } })} className="w-full bg-secondary rounded px-2 py-1.5 text-xs outline-none">
                        <option value="upcoming">Upcoming</option>
                        <option value="live">Live</option>
                        <option value="finished">Finished</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Period</label>
                      <select value={resultForm[g.id]?.current_period ?? g.current_period} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], current_period: e.target.value } })} className="w-full bg-secondary rounded px-2 py-1.5 text-xs outline-none">
                        <option value="not_started">Not Started</option>
                        <option value="first_half">1st Half</option>
                        <option value="half_time">Half Time</option>
                        <option value="second_half">2nd Half</option>
                        <option value="extra_time">Extra Time</option>
                        <option value="penalties">Penalties</option>
                        <option value="q1">Q1</option><option value="q2">Q2</option><option value="q3">Q3</option><option value="q4">Q4</option>
                        <option value="overtime">Overtime</option>
                        <option value="full_time">Full Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Minute</label>
                      <Input type="number" value={resultForm[g.id]?.current_minute ?? g.current_minute ?? 0} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], current_minute: Number(e.target.value) } })} className="h-7 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Home Score</label>
                      <Input type="number" value={resultForm[g.id]?.result_home ?? g.result_home ?? ""} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], result_home: Number(e.target.value) } })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Away Score</label>
                      <Input type="number" value={resultForm[g.id]?.result_away ?? g.result_away ?? ""} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], result_away: Number(e.target.value) } })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">HT Home</label>
                      <Input type="number" value={resultForm[g.id]?.half_time_home ?? g.half_time_home ?? ""} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], half_time_home: Number(e.target.value) } })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">HT Away</label>
                      <Input type="number" value={resultForm[g.id]?.half_time_away ?? g.half_time_away ?? ""} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], half_time_away: Number(e.target.value) } })} className="h-7 text-xs" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Corners Home</label>
                      <Input type="number" value={resultForm[g.id]?.total_corners_home ?? g.total_corners_home ?? 0} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], total_corners_home: Number(e.target.value) } })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Corners Away</label>
                      <Input type="number" value={resultForm[g.id]?.total_corners_away ?? g.total_corners_away ?? 0} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], total_corners_away: Number(e.target.value) } })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Cards Home</label>
                      <Input type="number" value={resultForm[g.id]?.total_cards_home ?? g.total_cards_home ?? 0} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], total_cards_home: Number(e.target.value) } })} className="h-7 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Cards Away</label>
                      <Input type="number" value={resultForm[g.id]?.total_cards_away ?? g.total_cards_away ?? 0} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], total_cards_away: Number(e.target.value) } })} className="h-7 text-xs" />
                    </div>
                  </div>
                  {g.has_extra_time && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground">ET Home</label>
                        <Input type="number" value={resultForm[g.id]?.extra_time_result_home ?? g.extra_time_result_home ?? ""} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], extra_time_result_home: Number(e.target.value) } })} className="h-7 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">ET Away</label>
                        <Input type="number" value={resultForm[g.id]?.extra_time_result_away ?? g.extra_time_result_away ?? ""} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], extra_time_result_away: Number(e.target.value) } })} className="h-7 text-xs" />
                      </div>
                    </div>
                  )}
                  {g.has_penalties && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground">Penalties Home</label>
                        <Input type="number" value={resultForm[g.id]?.penalty_home ?? g.penalty_home ?? ""} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], penalty_home: Number(e.target.value) } })} className="h-7 text-xs" />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Penalties Away</label>
                        <Input type="number" value={resultForm[g.id]?.penalty_away ?? g.penalty_away ?? ""} onChange={(e) => setResultForm({ ...resultForm, [g.id]: { ...resultForm[g.id], penalty_away: Number(e.target.value) } })} className="h-7 text-xs" />
                      </div>
                    </div>
                  )}
                  <button onClick={() => updateGameResults(g.id)} className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm">
                    <Save className="w-4 h-4" /> Save Results {(resultForm[g.id]?.status ?? g.status) === "finished" && "& Settle Bets"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {games.length === 0 && <p className="text-center py-8 text-muted-foreground">No games created yet</p>}
      </div>
    </div>
  );
};

export default AdminGameCreator;
