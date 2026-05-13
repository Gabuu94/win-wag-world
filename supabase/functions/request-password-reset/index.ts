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

function phonesMatch(storedPhone: string | null | undefined, requestedPhone: string): boolean {
  const storedDigits = (storedPhone || '').replace(/\D/g, '')
  const requestedDigits = requestedPhone.replace(/\D/g, '')
  const storedLocal = storedDigits.replace(/^0+/, '')
  const requestedLocal = requestedDigits.replace(/^0+/, '')
  return Boolean(
    storedDigits && requestedDigits &&
    (storedDigits === requestedDigits ||
      storedDigits.endsWith(requestedLocal) ||
      requestedDigits.endsWith(storedLocal)) &&
    Math.min(storedLocal.length, requestedLocal.length) >= 7
  )
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
    const { phone, email } = await req.json()

    if (!phone && !email) return genericResponse()

    const normalizedEmail = email ? String(email).trim().toLowerCase() : ''
    const normalizedPhone = phone ? String(phone).replace(/\D/g, '') : ''

    // Find by email first, then by phone — accept either
    let match: any = null
    if (normalizedEmail) {
      const { data: byEmail } = await supabase
        .from('profiles')
        .select('user_id, username, phone, email')
        .ilike('email', normalizedEmail)
        .limit(5)
      if (normalizedPhone) {
        match = (byEmail || []).find((p: any) => phonesMatch(p.phone, normalizedPhone)) || (byEmail || [])[0]
      } else {
        match = (byEmail || [])[0]
      }
    }
    if (!match && normalizedPhone) {
      const { data: byPhone } = await supabase
        .from('profiles')
        .select('user_id, username, phone, email')
        .not('email', 'is', null)
        .limit(200)
      match = (byPhone || []).find((p: any) => phonesMatch(p.phone, normalizedPhone))
    }

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

    const baseUrl = 'https://betking.space'
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
