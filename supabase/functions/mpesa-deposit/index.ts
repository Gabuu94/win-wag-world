import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LIPWA_API_KEY = Deno.env.get('LIPWA_API_KEY');

    // Read channel ID from app_settings (admin-configurable), fall back to env/default
    let LIPWA_CHANNEL_ID = Deno.env.get('LIPWA_CHANNEL_ID') || 'CH_23BD07DB';
    try {
      const admin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
      const { data } = await admin.from('app_settings').select('value').eq('key', 'lipwa_channel_id').maybeSingle();
      if (data?.value) LIPWA_CHANNEL_ID = data.value;
    } catch (e) {
      console.error('Failed to read lipwa_channel_id from app_settings:', e);
    }

    if (!LIPWA_API_KEY) {
      throw new Error('Lipwa API key not configured');
    }

    const { phone_number, amount, user_id, purpose } = await req.json();

    if (!phone_number || !amount || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields: phone_number, amount, user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isFeeDeposit = purpose === 'withdrawal_fee' || purpose === 'agent_fee';
    const minAmount = isFeeDeposit ? 1 : 1500;
    if (amount < minAmount) {
      return new Response(JSON.stringify({ error: `Minimum deposit is KES ${minAmount.toLocaleString()}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send STK Push via Lipwa
    const response = await fetch('https://pay.lipwa.app/api/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LIPWA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number,
        amount: Math.round(amount),
        channel_id: LIPWA_CHANNEL_ID,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback`,
        api_ref: { user_id },
      }),
    });

    const data = await response.json();
    console.log('Lipwa STK push response:', response.status, JSON.stringify(data));

    if (!response.ok) {
      throw new Error(`Lipwa API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      checkout_id: data.CheckoutRequestID,
      message: data.CustomerMessage || 'STK Push sent. Check your phone.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Mpesa deposit error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
