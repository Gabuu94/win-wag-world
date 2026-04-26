const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// A selection belongs to an admin (custom) game if its id starts with `admin-`
// or its matchLabel matches a known admin game home/away pair. These bets are
// settled deterministically by the admin via "Set Result" — never randomly here.
function isAdminSelection(s: any, adminLabels: Set<string>): boolean {
  const id = String(s?.id || "");
  if (id.startsWith("admin-")) return true;
  const label = String(s?.matchLabel || "");
  for (const l of adminLabels) {
    if (label && label.includes(l)) return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Build a set of all admin-game team labels so we can recognize their bets.
    const { data: adminGames } = await supabase.from("admin_games").select("home_team, away_team");
    const adminLabels = new Set<string>();
    (adminGames || []).forEach((g: any) => {
      if (g?.home_team && g?.away_team) adminLabels.add(`${g.home_team}`);
    });

    // Get all pending bets older than 2 hours (auto-settle as demo for API matches only)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: pendingBets, error } = await supabase
      .from("bets")
      .select("*")
      .eq("status", "pending")
      .lt("placed_at", twoHoursAgo);

    if (error) throw error;
    if (!pendingBets || pendingBets.length === 0) {
      return new Response(JSON.stringify({ settled: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let settled = 0;
    let skipped = 0;
    for (const bet of pendingBets) {
      const sels = (bet.selections as any[]) || [];
      // SKIP any bet that contains a custom/admin-game selection.
      // Those are settled deterministically by the admin in the Game Manager.
      const touchesAdmin = sels.some((s) => isAdminSelection(s, adminLabels));
      if (touchesAdmin) { skipped++; continue; }

      // Demo random settlement only for non-admin (API/fallback) bets.
      const won = Math.random() < 0.4;
      const newStatus = won ? "won" : "lost";

      await supabase.from("bets").update({ status: newStatus }).eq("id", bet.id);

      if (won) {
        const { data: profile } = await supabase.from("profiles").select("balance").eq("user_id", bet.user_id).single();
        if (profile) {
          await supabase.from("profiles").update({ balance: Number(profile.balance) + Number(bet.potential_win) }).eq("user_id", bet.user_id);
        }
        await supabase.from("notifications").insert({
          user_id: bet.user_id,
          title: "Bet Won! 🎉",
          message: `Your bet won ${Number(bet.potential_win).toFixed(2)}!`,
          type: "bet_result",
        });
      } else {
        await supabase.from("notifications").insert({
          user_id: bet.user_id,
          title: "Bet Lost",
          message: `Your ${Number(bet.stake).toFixed(2)} bet did not win.`,
          type: "bet_result",
        });
      }
      settled++;
    }

    return new Response(JSON.stringify({ settled, skipped_admin: skipped }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
