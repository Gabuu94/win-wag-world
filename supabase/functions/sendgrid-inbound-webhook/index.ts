// SendGrid Inbound Parse webhook — receives customer email replies,
// stores them in `email_replies`, and forwards a copy to the admin inbox.
//
// Public endpoint (verify_jwt = false). SendGrid POSTs multipart/form-data.
// Docs: https://docs.sendgrid.com/for-developers/parsing-email/setting-up-the-inbound-parse-webhook
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ADMIN_FORWARD_EMAIL = 'tong1250t@gmail.com'

function parseAddress(raw: string | null): { email: string; name: string | null } {
  if (!raw) return { email: '', name: null }
  const m = raw.match(/^\s*(?:"?([^"<]+?)"?\s*)?<?([^<>\s]+@[^<>\s]+)>?/)
  if (!m) return { email: raw.trim(), name: null }
  return { email: m[2].trim().toLowerCase(), name: m[1]?.trim() || null }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const form = await req.formData()
    const fromRaw = form.get('from')?.toString() ?? null
    const toRaw = form.get('to')?.toString() ?? null
    const subject = form.get('subject')?.toString() ?? '(no subject)'
    const text = form.get('text')?.toString() ?? ''
    const html = form.get('html')?.toString() ?? ''
    const headers = form.get('headers')?.toString() ?? ''
    const envelope = form.get('envelope')?.toString() ?? ''

    const from = parseAddress(fromRaw)
    const to = parseAddress(toRaw)

    // Try to match the sender to an existing user
    let matchedUserId: string | null = null
    if (from.email) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', from.email)
        .maybeSingle()
      matchedUserId = profile?.user_id ?? null
    }

    const { data: replyRow, error: insertError } = await supabase
      .from('email_replies')
      .insert({
        from_email: from.email,
        from_name: from.name,
        to_email: to.email,
        subject,
        text_body: text,
        html_body: html,
        raw_headers: { headers, envelope },
        matched_user_id: matchedUserId,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Failed to store reply', insertError)
      return new Response(JSON.stringify({ error: 'storage_failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Forward a copy to the admin's personal email
    try {
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'customer-reply-forward',
          recipientEmail: ADMIN_FORWARD_EMAIL,
          idempotencyKey: `reply-fwd-${replyRow.id}`,
          templateData: {
            fromName: from.name || from.email,
            fromEmail: from.email,
            subject,
            body: text || html.replace(/<[^>]+>/g, ''),
            replyId: replyRow.id,
          },
        },
      })
      await supabase
        .from('email_replies')
        .update({ forwarded_at: new Date().toISOString() })
        .eq('id', replyRow.id)
    } catch (fwdErr) {
      console.error('Forward failed (reply still stored)', fwdErr)
    }

    return new Response(JSON.stringify({ success: true, id: replyRow.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Inbound parse error', err)
    return new Response(JSON.stringify({ error: 'parse_failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
