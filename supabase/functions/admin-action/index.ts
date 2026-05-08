import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOKEN_TTL_MINUTES = 30;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Not authorized");

    const body = await req.json();
    const { action } = body;

    if (action === "delete_user" && body.target_user_id) {
      const { error } = await adminClient.auth.admin.deleteUser(body.target_user_id);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "adjust_balance") {
      const targetUserId = String(body.target_user_id || "");
      const amount = Number(body.amount);
      const reason = String(body.reason || "Admin balance adjustment").slice(0, 500);
      if (!targetUserId || !Number.isFinite(amount) || amount === 0) throw new Error("Enter a valid adjustment amount");

      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("balance")
        .eq("user_id", targetUserId)
        .maybeSingle();
      if (profileError || !profile) throw new Error("User profile not found");
      const newBalance = Math.max(0, Number(profile.balance || 0) + amount);

      const { error: updateError } = await adminClient.from("profiles").update({ balance: newBalance }).eq("user_id", targetUserId);
      if (updateError) throw updateError;
      await adminClient.from("admin_action_logs").insert({ admin_user_id: user.id, target_user_id: targetUserId, action, amount, reason, metadata: { previous_balance: profile.balance, new_balance: newBalance } });
      return json({ success: true, balance: newBalance });
    }

    if (action === "flag_account") {
      const targetUserId = String(body.target_user_id || "");
      const flagged = Boolean(body.flagged);
      const reason = flagged ? String(body.reason || "Flagged for review").slice(0, 500) : null;
      if (!targetUserId) throw new Error("Missing user");
      const { error } = await adminClient.from("profiles").update({
        is_flagged: flagged,
        flag_reason: reason,
        flagged_at: flagged ? new Date().toISOString() : null,
        flagged_by: flagged ? user.id : null,
      }).eq("user_id", targetUserId);
      if (error) throw error;
      await adminClient.from("admin_action_logs").insert({ admin_user_id: user.id, target_user_id: targetUserId, action, reason: reason || "Flag cleared", metadata: { flagged } });
      return json({ success: true });
    }

    if (action === "resend_password_reset") {
      const targetUserId = String(body.target_user_id || "");
      if (!targetUserId) throw new Error("Missing user");
      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("username, email")
        .eq("user_id", targetUserId)
        .maybeSingle();
      if (profileError || !profile) throw new Error("User profile not found");
      if (!profile.email) throw new Error("This user has no recovery email saved");

      const rawToken = generateToken();
      const tokenHash = await sha256Hex(rawToken);
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString();
      const { error: tokenError } = await adminClient.from("password_reset_tokens").insert({ user_id: targetUserId, token_hash: tokenHash, expires_at: expiresAt });
      if (tokenError) throw tokenError;

      const { error: sendError } = await adminClient.functions.invoke("send-transactional-email", {
        body: {
          templateName: "password-reset",
          recipientEmail: String(profile.email).toLowerCase(),
          idempotencyKey: `admin-pwd-reset-${tokenHash.slice(0, 16)}`,
          templateData: { username: profile.username || "Player", resetUrl: `https://betking.space/reset-password?token=${rawToken}`, expiresInMinutes: TOKEN_TTL_MINUTES },
        },
      });
      if (sendError) throw sendError;
      await adminClient.from("admin_action_logs").insert({ admin_user_id: user.id, target_user_id: targetUserId, action, metadata: { recipient: profile.email } });
      return json({ success: true });
    }

    if (action === "resend_activation") {
      const targetUserId = String(body.target_user_id || "");
      if (!targetUserId) throw new Error("Missing user");
      const { data: profile, error: profileError } = await adminClient.from("profiles").select("username, email").eq("user_id", targetUserId).maybeSingle();
      if (profileError || !profile) throw new Error("User profile not found");
      if (!profile.email) throw new Error("This user has no recovery email saved");
      const { error: sendError } = await adminClient.functions.invoke("send-transactional-email", {
        body: { templateName: "welcome", recipientEmail: String(profile.email).toLowerCase(), idempotencyKey: `admin-activation-${targetUserId}-${Date.now()}`, templateData: { username: profile.username || "Player", ctaUrl: "https://betking.space/?deposit=1" } },
      });
      if (sendError) throw sendError;
      await adminClient.from("admin_action_logs").insert({ admin_user_id: user.id, target_user_id: targetUserId, action, metadata: { recipient: profile.email } });
      return json({ success: true });
    }

    if (action === "register_user") {
      const { email, username, password } = body;
      if (!email || !username || !password) throw new Error("Missing fields");
      
      // Check if user already exists
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u: any) => u.email === email);
      if (existing) {
        return new Response(JSON.stringify({ error: "A user with this email already exists" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      });
      if (createError) throw createError;
      
      return json({ success: true, userId: newUser.user.id });
    }

    if (action === "create_admin") {
      const { email, username, password } = body;
      if (!email || !username || !password) throw new Error("Missing fields");
      
      // Check if user exists
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u: any) => u.email === email);
      
      let userId: string;
      if (existing) {
        userId = existing.id;
      } else {
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username },
        });
        if (createError) throw createError;
        userId = newUser.user.id;
      }
      
      // Assign admin role
      const { error: roleError } = await adminClient.from("user_roles").upsert(
        { user_id: userId, role: "admin" },
        { onConflict: "user_id,role" }
      );
      if (roleError) throw roleError;
      
      return json({ success: true, userId });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error: any) {
    return json({ error: error.message }, 500);
  }
});
