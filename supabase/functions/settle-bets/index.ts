import { corsHeaders } from '@supabase/supabase-js/cors';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get all pending bets older than 2 hours (auto-settle as demo)
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
    for (const bet of pendingBets) {
      // Simple settlement: ~40% chance of winning for demo
      const won = Math.random() < 0.4;
      const newStatus = won ? "won" : "lost";

      await supabase.from("bets").update({ status: newStatus }).eq("id", bet.id);

      if (won) {
        // Credit winnings
        await supabase.rpc("", {}).catch(() => {});
        const { data: profile } = await supabase.from("profiles").select("balance").eq("user_id", bet.user_id).single();
        if (profile) {
          await supabase.from("profiles").update({ balance: Number(profile.balance) + Number(bet.potential_win) }).eq("user_id", bet.user_id);
        }
        
        await supabase.from("notifications").insert({
          user_id: bet.user_id,
          title: "Bet Won! 🎉",
          message: `Your bet won $${Number(bet.potential_win).toFixed(2)}!`,
          type: "bet_result",
        });
      } else {
        await supabase.from("notifications").insert({
          user_id: bet.user_id,
          title: "Bet Lost",
          message: `Your $${Number(bet.stake).toFixed(2)} bet did not win.`,
          type: "bet_result",
        });
      }
      settled++;
    }

    return new Response(JSON.stringify({ settled }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
