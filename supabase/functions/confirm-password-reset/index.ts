import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function jsonError(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') // "validate" or omitted = perform reset
    const body = await req.json().catch(() => ({}))
    const token = body.token as string | undefined
    const newPassword = body.newPassword as string | undefined

    if (!token) return jsonError('Token is required')

    const tokenHash = await sha256Hex(token)

    const { data: rec, error: lookupErr } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (lookupErr || !rec) return jsonError('Invalid or expired link', 404)
    if (rec.used_at) return jsonError('This link has already been used', 410)
    if (new Date(rec.expires_at).getTime() < Date.now()) return jsonError('This link has expired', 410)

    if (action === 'validate') {
      return new Response(JSON.stringify({ valid: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!newPassword || newPassword.length < 5) {
      return jsonError('Password must be at least 5 characters')
    }

    // Update password via admin API
    const { error: updateErr } = await supabase.auth.admin.updateUserById(rec.user_id, {
      password: newPassword,
    })
    if (updateErr) {
      console.error('Failed to update password', updateErr)
      return jsonError('Failed to update password', 500)
    }

    // Mark token as used (atomic)
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', rec.id)
      .is('used_at', null)

    // Invalidate all other unused tokens for this user
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', rec.user_id)
      .is('used_at', null)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('confirm-password-reset error', err)
    return jsonError('Something went wrong', 500)
  }
})
