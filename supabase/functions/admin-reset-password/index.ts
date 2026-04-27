import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { phone, newPassword, requestId } = await req.json();
    if (!phone || !newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "phone and newPassword (min 6 chars) required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Normalize phone to synthetic email
    const digits = String(phone).replace(/\D/g, "");
    const syntheticEmail = `${digits}@betking.app`;

    // Find user
    let foundId: string | null = null;
    let page = 1;
    while (page < 20) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const u = data.users.find((x) => x.email === syntheticEmail);
      if (u) { foundId = u.id; break; }
      if (data.users.length < 200) break;
      page++;
    }
    if (!foundId) {
      return new Response(JSON.stringify({ error: "No user found with that phone" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(foundId, { password: newPassword });
    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark request done if id provided
    if (requestId) {
      await admin.from("password_reset_requests").update({
        status: "done",
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      }).eq("id", requestId);
    }

    // Notify the user
    await admin.from("notifications").insert({
      user_id: foundId,
      title: "Password Reset",
      message: "Your password has been reset by support. Please sign in with your new password.",
      type: "info",
    });

    return new Response(JSON.stringify({ success: true, userId: foundId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
