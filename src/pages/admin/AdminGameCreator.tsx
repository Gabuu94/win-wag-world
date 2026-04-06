import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Eye, EyeOff, Edit, ChevronDown, ChevronUp, Save } from "lucide-react";
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
  { type: "highest_scoring_quarter", name: "Highest Scoring Quarter", selections: [{ name: "Q1", odds: 4.0 }, { name: "Q2", odds: 3.5 }, { name: "Q3", odds: 3.5 }, { name: "Q4", odds: 3.5 }] },
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
    { type: "distance", name: "Fight Goes the Distance", selections: [{ name: "Yes", odds: 2.3 }, { name: "No", odds: 1.6 }] },
  ],
};

interface GameForm {
  sport: string;
  home_team: string;
  away_team: string;
  league: string;
  start_time: string;
  end_time: string;
  has_extra_time: boolean;
  has_penalties: boolean;
  markets: { type: string; name: string; selections: { name: string; odds: number }[]; enabled: boolean }[];
}

const AdminGameCreator = () => {
  const [games, setGames] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedGame, setExpandedGame] = useState<string | null>(null);
  const [resultForm, setResultForm] = useState<Record<string, any>>({});

  const defaultForm: GameForm = {
    sport: "football",
    home_team: "",
    away_team: "",
    league: "",
    start_time: "",
    end_time: "",
    has_extra_time: false,
    has_penalties: false,
    markets: (DEFAULT_MARKETS["football"] || []).map((m) => ({ ...m, enabled: true })),
  };

  const [form, setForm] = useState<GameForm>(defaultForm);

  const fetchGames = async () => {
    const { data } = await supabase.from("admin_games").select("*").order("created_at", { ascending: false });
    setGames((data as any[]) || []);
  };

  useEffect(() => { fetchGames(); }, []);

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

  const createGame = async () => {
    if (!form.home_team || !form.away_team || !form.start_time) {
      toast({ title: "Missing fields", description: "Fill in team names and start time", variant: "destructive" });
      return;
    }

    const { data: game, error: gameError } = await supabase.from("admin_games").insert({
      sport: form.sport,
      home_team: form.home_team,
      away_team: form.away_team,
      league: form.league || "Custom League",
      start_time: form.start_time,
      end_time: form.end_time || null,
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
    await supabase.from("admin_games").delete().eq("id", id);
    fetchGames();
  };

  const updateGameResults = async (gameId: string) => {
    const r = resultForm[gameId] || {};
    await supabase.from("admin_games").update({
      result_home: r.result_home ?? null,
      result_away: r.result_away ?? null,
      half_time_home: r.half_time_home ?? null,
      half_time_away: r.half_time_away ?? null,
      current_minute: r.current_minute ?? 0,
      current_period: r.current_period ?? "not_started",
      status: r.status ?? "upcoming",
      total_corners_home: r.total_corners_home ?? 0,
      total_corners_away: r.total_corners_away ?? 0,
      total_cards_home: r.total_cards_home ?? 0,
      total_cards_away: r.total_cards_away ?? 0,
      extra_time_result_home: r.extra_time_result_home ?? null,
      extra_time_result_away: r.extra_time_result_away ?? null,
      penalty_home: r.penalty_home ?? null,
      penalty_away: r.penalty_away ?? null,
      quarters_scores: r.quarters_scores ? JSON.parse(r.quarters_scores) : [],
    }).eq("id", gameId);
    toast({ title: "Results updated!" });
    fetchGames();
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
              <label className="text-xs text-muted-foreground mb-1 block">End Time</label>
              <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>

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
        {games.map((g) => (
          <div key={g.id} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground uppercase">{g.sport} · {g.league}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${g.is_published ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {g.is_published ? "Published" : "Draft"}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full bg-secondary`}>{g.status}</span>
                </div>
                <h3 className="font-bold">{g.home_team} vs {g.away_team}</h3>
                <p className="text-xs text-muted-foreground">{new Date(g.start_time).toLocaleString()}</p>
                {g.result_home !== null && <p className="text-sm font-medium text-primary mt-1">Score: {g.result_home} - {g.result_away}</p>}
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
                  <Save className="w-4 h-4" /> Save Results
                </button>
              </div>
            )}
          </div>
        ))}
        {games.length === 0 && <p className="text-center py-8 text-muted-foreground">No games created yet</p>}
      </div>
    </div>
  );
};

export default AdminGameCreator;
