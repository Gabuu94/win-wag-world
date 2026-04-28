import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const TOKEN_TTL_MINUTES = 30

async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // Generic success — never reveal whether the account exists
  const genericResponse = () =>
    new Response(
      JSON.stringify({ success: true, message: "If an account with that phone and email exists, we've sent a reset link." }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  try {
    const { phone, email, siteUrl } = await req.json()

    if (!phone || !email) return genericResponse()

    const normalizedEmail = String(email).trim().toLowerCase()
    const normalizedPhone = String(phone).replace(/\D/g, '')

    // Find profile that matches BOTH phone and email
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, username, phone, email')
      .ilike('email', normalizedEmail)
      .limit(5)

    const match = (profiles || []).find(
      (p: any) => (p.phone || '').replace(/\D/g, '') === normalizedPhone
    )

    if (!match) {
      console.log('No matching profile for password reset request')
      return genericResponse()
    }

    // Generate token, store hash
    const rawToken = generateToken()
    const tokenHash = await sha256Hex(rawToken)
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000).toISOString()

    const { error: insertErr } = await supabase
      .from('password_reset_tokens')
      .insert({ user_id: match.user_id, token_hash: tokenHash, expires_at: expiresAt })

    if (insertErr) {
      console.error('Failed to insert reset token', insertErr)
      return genericResponse()
    }

    const baseUrl = (siteUrl || 'https://betking.space').replace(/\/$/, '')
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`

    // Send branded email via send-transactional-email
    const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'password-reset',
        recipientEmail: normalizedEmail,
        idempotencyKey: `pwd-reset-${tokenHash.slice(0, 16)}`,
        templateData: {
          username: match.username || 'Player',
          resetUrl,
          expiresInMinutes: TOKEN_TTL_MINUTES,
        },
      },
    })

    if (sendErr) {
      console.error('Failed to enqueue reset email', sendErr)
    }

    return genericResponse()
  } catch (err) {
    console.error('request-password-reset error', err)
    return genericResponse()
  }
})
