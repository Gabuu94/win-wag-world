import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Auth: require an admin caller
  const authHeader = req.headers.get('Authorization') || ''
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData } = await userClient.auth.getUser()
  const callerId = userData?.user?.id
  if (!callerId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: isAdmin } = await admin.rpc('has_role', { _user_id: callerId, _role: 'admin' })
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { promotionId } = body
  if (!promotionId) {
    return new Response(JSON.stringify({ error: 'promotionId required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: promo, error: promoErr } = await admin
    .from('promotions')
    .select('*')
    .eq('id', promotionId)
    .single()

  if (promoErr || !promo) {
    return new Response(JSON.stringify({ error: 'Promotion not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Pull all users with an email
  const { data: recipients } = await admin
    .from('profiles')
    .select('user_id, username, email')
    .not('email', 'is', null)

  const list = (recipients || []).filter((r: any) => r.email && r.email.trim().length > 0)
  let sent = 0
  let failed = 0

  // Send sequentially to avoid bursting the queue. Each invoke enqueues only.
  for (const r of list) {
    try {
      const { error } = await admin.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'promotion-announcement',
          recipientEmail: r.email,
          idempotencyKey: `promo-${promotionId}-${r.user_id}`,
          templateData: {
            username: r.username || 'Player',
            promoTitle: promo.title,
            promoDescription: promo.description,
            bonusType: promo.bonus_type,
            bonusValue: Number(promo.bonus_value),
            minDeposit: Number(promo.min_deposit || 0),
            endDate: promo.end_date,
            ctaUrl: 'https://betking.space/promotions',
          },
        },
      })
      if (error) failed++
      else sent++
    } catch (_e) {
      failed++
    }
  }

  return new Response(JSON.stringify({ success: true, recipients: list.length, sent, failed }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
