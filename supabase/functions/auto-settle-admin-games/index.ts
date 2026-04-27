// Auto start/finish admin (custom) games based on start_time / end_time and settle
// every pending bet that has only this game's selections. Runs from pg_cron every minute.
//
// Settlement rules MUST mirror src/pages/admin/AdminGameCreator.tsx settleBetsForGame —
// per-market independence (a wrong correct-score doesn't kill a winning Home Win leg).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function computeWins(
  marketType: string,
  selections: any[],
  ctx: {
    homeName: string; awayName: string;
    homeScore: number; awayScore: number;
    htHome: number; htAway: number;
    totalGoals: number; totalCorners: number; totalCards: number;
    hasExtraTime: boolean; extraEntered: boolean;
  }
): string[] {
  const { homeName, awayName, homeScore, awayScore, htHome, htAway, totalGoals, totalCorners, totalCards, hasExtraTime, extraEntered } = ctx;
  const wins: string[] = [];
  switch (marketType) {
    case "match_result":
    case "match_winner":
      if (homeScore > awayScore) wins.push("Home Win", "Home", `${homeName} Win`, homeName, "1");
      else if (homeScore < awayScore) wins.push("Away Win", "Away", `${awayName} Win`, awayName, "2");
      else wins.push("Draw", "X");
      break;
    case "draw_no_bet":
      if (homeScore > awayScore) wins.push("Home", `${homeName} Win`, homeName);
      else if (homeScore < awayScore) wins.push("Away", `${awayName} Win`, awayName);
      else wins.push("Home", "Away", `${homeName} Win`, `${awayName} Win`);
      break;
    case "btts": wins.push(homeScore > 0 && awayScore > 0 ? "Yes" : "No"); break;
    case "over_under_0_5": wins.push(totalGoals > 0.5 ? "Over 0.5" : "Under 0.5"); break;
    case "over_under_1_5": wins.push(totalGoals > 1.5 ? "Over 1.5" : "Under 1.5"); break;
    case "over_under_2_5": wins.push(totalGoals > 2.5 ? "Over 2.5" : "Under 2.5"); break;
    case "over_under_3_5": wins.push(totalGoals > 3.5 ? "Over 3.5" : "Under 3.5"); break;
    case "over_under_4_5": wins.push(totalGoals > 4.5 ? "Over 4.5" : "Under 4.5"); break;
    case "over_under_5_5": wins.push(totalGoals > 5.5 ? "Over 5.5" : "Under 5.5"); break;
    case "double_chance":
      if (homeScore >= awayScore) wins.push("1X");
      if (homeScore !== awayScore) wins.push("12");
      if (awayScore >= homeScore) wins.push("X2");
      break;
    case "first_half":
      if (htHome > htAway) wins.push("Home", `${homeName} Win`, homeName, "1");
      else if (htHome < htAway) wins.push("Away", `${awayName} Win`, awayName, "2");
      else wins.push("Draw", "X");
      break;
    case "second_half": {
      const sh = (homeScore - htHome) - (awayScore - htAway);
      if (sh > 0) wins.push("Home", `${homeName} Win`, homeName, "1");
      else if (sh < 0) wins.push("Away", `${awayName} Win`, awayName, "2");
      else wins.push("Draw", "X");
      break;
    }
    case "first_half_btts": wins.push(htHome > 0 && htAway > 0 ? "Yes" : "No"); break;
    case "first_half_over_0_5": wins.push((htHome + htAway) > 0.5 ? "Over 0.5" : "Under 0.5"); break;
    case "first_half_over_1_5": wins.push((htHome + htAway) > 1.5 ? "Over 1.5" : "Under 1.5"); break;
    case "team_total_home_over_1_5": wins.push(homeScore > 1.5 ? "Over 1.5" : "Under 1.5"); break;
    case "team_total_away_over_1_5": wins.push(awayScore > 1.5 ? "Over 1.5" : "Under 1.5"); break;
    case "goal_in_both_halves":
      wins.push((htHome + htAway) > 0 && ((homeScore - htHome) + (awayScore - htAway)) > 0 ? "Yes" : "No");
      break;
    case "corners_total": wins.push(totalCorners > 9.5 ? "Over 9.5" : "Under 9.5"); break;
    case "cards_total": wins.push(totalCards > 3.5 ? "Over 3.5" : "Under 3.5"); break;
    case "correct_score": wins.push(`${homeScore}-${awayScore}`); break;
    case "halftime_fulltime": {
      const ht = htHome > htAway ? "Home" : htHome < htAway ? "Away" : "Draw";
      const ft = homeScore > awayScore ? "Home" : homeScore < awayScore ? "Away" : "Draw";
      wins.push(`${ht}/${ft}`);
      break;
    }
    case "clean_sheet_home": wins.push(awayScore === 0 ? "Yes" : "No"); break;
    case "clean_sheet_away": wins.push(homeScore === 0 ? "Yes" : "No"); break;
    case "win_to_nil_home": wins.push(homeScore > 0 && awayScore === 0 ? "Yes" : "No"); break;
    case "win_to_nil_away": wins.push(awayScore > 0 && homeScore === 0 ? "Yes" : "No"); break;
    case "extra_time": wins.push(hasExtraTime && extraEntered ? "Yes" : "No"); break;
    default: {
      // Unknown / custom — auto-pick a random offered selection
      if (selections.length > 0) {
        const choice = selections[Math.floor(Math.random() * selections.length)];
        wins.push(String(choice.name));
      }
      break;
    }
  }
  return wins;
}

async function settleGame(supabase: any, game: any) {
  const { data: markets } = await supabase.from("admin_game_markets").select("*").eq("game_id", game.id);
  if (!markets) return { settled: 0 };

  const { data: pendingBets } = await supabase.from("bets").select("*").eq("status", "pending");
  if (!pendingBets) return { settled: 0 };

  const homeName = String(game.home_team || "").trim();
  const awayName = String(game.away_team || "").trim();
  const matchLabel = `${homeName} vs ${awayName}`;
  // If admin never entered a final score, generate a plausible random one so settlement can proceed.
  const adminEnteredScore = game.result_home != null && game.result_away != null;
  let homeScore = Number(game.result_home ?? 0);
  let awayScore = Number(game.result_away ?? 0);
  if (!adminEnteredScore) {
    homeScore = Math.floor(Math.random() * 4); // 0–3
    awayScore = Math.floor(Math.random() * 4);
  }
  const htHome = Number(game.half_time_home ?? Math.floor(homeScore / 2));
  const htAway = Number(game.half_time_away ?? Math.floor(awayScore / 2));
  const totalGoals = homeScore + awayScore;
  const cornersEntered = (game.total_corners_home ?? 0) + (game.total_corners_away ?? 0) > 0;
  const cardsEntered = (game.total_cards_home ?? 0) + (game.total_cards_away ?? 0) > 0;
  const totalCorners = cornersEntered
    ? Number(game.total_corners_home ?? 0) + Number(game.total_corners_away ?? 0)
    : Math.floor(6 + Math.random() * 8);
  const totalCards = cardsEntered
    ? Number(game.total_cards_home ?? 0) + Number(game.total_cards_away ?? 0)
    : Math.floor(2 + Math.random() * 4);
  const ctx = {
    homeName, awayName, homeScore, awayScore, htHome, htAway,
    totalGoals, totalCorners, totalCards,
    hasExtraTime: !!game.has_extra_time,
    extraEntered: game.extra_time_result_home != null,
  };

  const winningPicks: Record<string, string[]> = {};
  for (const m of markets) {
    const wins = computeWins(m.market_type, (m.selections as any[]) || [], ctx);
    winningPicks[m.market_type] = wins;
    await supabase.from("admin_game_markets").update({ result: wins.join(", ") || null }).eq("id", m.id);
  }

  // Persist auto-generated final score so the public match page can show it.
  if (!adminEnteredScore) {
    await supabase.from("admin_games").update({
      result_home: homeScore, result_away: awayScore,
      half_time_home: htHome, half_time_away: htAway,
    }).eq("id", game.id);
  }

  const selectionMatchesGame = (s: any): boolean => {
    const id = String(s?.id || "");
    if (id.startsWith(`admin-${game.id}`)) return true;
    const label = String(s?.matchLabel || "");
    return !!(label && label.includes(homeName) && label.includes(awayName));
  };
  const extractMarketType = (s: any): string | null => {
    const id = String(s?.id || "");
    const prefix = `admin-${game.id}-`;
    if (!id.startsWith(prefix)) return null;
    const tail = id.slice(prefix.length);
    if (tail === "home" || tail === "draw" || tail === "away") return "match_result";
    for (const mt of Object.keys(winningPicks)) {
      if (tail === mt || tail.startsWith(`${mt}-`)) return mt;
    }
    return null;
  };
  const isWinningSelection = (s: any): boolean => {
    const pickLower = String(s?.pick || "").trim().toLowerCase();
    const mt = extractMarketType(s);
    const candidateLists = mt && winningPicks[mt] ? [winningPicks[mt]] : Object.values(winningPicks);
    for (const wins of candidateLists) {
      for (const w of wins) {
        const wLower = w.toLowerCase();
        if (pickLower === wLower) return true;
        if (pickLower.includes(wLower) || wLower.includes(pickLower)) return true;
      }
    }
    return false;
  };

  let settled = 0;
  for (const bet of pendingBets) {
    const sels = (bet.selections as any[]) || [];
    const matched = sels.filter(selectionMatchesGame);
    if (matched.length === 0) continue;
    const others = sels.filter((s) => !selectionMatchesGame(s));
    if (others.length > 0) continue; // leave for the other game's settlement

    const allWon = matched.every(isWinningSelection);
    const newStatus = allWon ? "won" : "lost";
    await supabase.from("bets").update({ status: newStatus }).eq("id", bet.id);
    if (allWon) {
      const { data: profile } = await supabase.from("profiles").select("balance").eq("user_id", bet.user_id).single();
      if (profile) {
        await supabase.from("profiles").update({ balance: Number(profile.balance) + Number(bet.potential_win) }).eq("user_id", bet.user_id);
      }
      await supabase.from("notifications").insert({
        user_id: bet.user_id, title: "Bet Won! 🎉",
        message: `Your bet on ${matchLabel} won ${Number(bet.potential_win).toFixed(2)}!`,
        type: "win",
      });
    } else {
      await supabase.from("notifications").insert({
        user_id: bet.user_id, title: "Bet Lost",
        message: `Your bet on ${matchLabel} did not win. Better luck next time!`,
        type: "loss",
      });
    }
    settled++;
  }
  return { settled };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const nowIso = new Date().toISOString();

    // 1. Flip upcoming → live (first_half) for any published game whose start_time has passed
    const { data: toStart } = await supabase
      .from("admin_games")
      .select("id")
      .eq("is_published", true)
      .in("status", ["upcoming"])
      .lte("start_time", nowIso);
    let started = 0;
    for (const g of toStart || []) {
      await supabase.from("admin_games").update({ status: "live", current_period: "first_half" }).eq("id", g.id);
      started++;
    }

    // 2. Advance live games through periods based on elapsed time
    // Timeline (% of total duration): 0-45% first_half | 45-55% half_time | 55-100% second_half
    const { data: liveGames } = await supabase
      .from("admin_games")
      .select("id, start_time, end_time, current_period, status")
      .eq("status", "live")
      .not("end_time", "is", null);

    let periodChanges = 0;
    for (const g of liveGames || []) {
      const start = new Date(g.start_time).getTime();
      const end = new Date(g.end_time!).getTime();
      const now = Date.now();
      if (now >= end) continue; // handled by finish step below
      const pct = (now - start) / (end - start);
      let target: string;
      if (pct < 0.45) target = "first_half";
      else if (pct < 0.55) target = "half_time";
      else target = "second_half";

      if (g.current_period !== target) {
        await supabase.from("admin_games").update({ current_period: target }).eq("id", g.id);
        periodChanges++;
      }
    }

    // 3. Flip live (or upcoming-but-overdue) → finished and settle bets
    const { data: toFinish } = await supabase
      .from("admin_games")
      .select("*")
      .in("status", ["upcoming", "live"])
      .not("end_time", "is", null)
      .lte("end_time", nowIso);

    let finished = 0;
    let totalSettled = 0;
    for (const g of toFinish || []) {
      // Mark finished first so the public match page reveals the final score & status
      await supabase.from("admin_games").update({ status: "finished", current_period: "full_time" }).eq("id", g.id);
      const { settled } = await settleGame(supabase, g);
      totalSettled += settled;
      finished++;
    }

    return new Response(
      JSON.stringify({ ok: true, started, periodChanges, finished, settled: totalSettled, at: nowIso }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
