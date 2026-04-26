import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Phone-based admin login: 0797585941 → +254797585941 → synthetic email
    const adminPhoneDigits = "254797585941";
    const adminEmail = `${adminPhoneDigits}@betking.app`;
    const adminPassword = "125050.Lit";

    // Check if admin already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === adminEmail);

    let userId: string;
    if (existingAdmin) {
      userId = existingAdmin.id;
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        phone: `+${adminPhoneDigits}`,
        user_metadata: { username: "BetKing Admin", phone: `+${adminPhoneDigits}`, country: "KE", currency: "KES" },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // Ensure admin role exists
    const { error: roleError } = await supabase.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role" }
    );
    if (roleError) throw roleError;

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
