const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NOWPAYMENTS_API_KEY = Deno.env.get('NOWPAYMENTS_API_KEY');
    if (!NOWPAYMENTS_API_KEY) {
      throw new Error('NOWPayments API key not configured');
    }

    const { amount_usd, currency, user_id } = await req.json();

    if (!amount_usd || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pay_currency = currency || 'btc';

    // Create payment via NOWPayments
    const response = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount_usd,
        price_currency: 'usd',
        pay_currency,
        order_id: `deposit_${user_id}_${Date.now()}`,
        order_description: `Deposit $${amount_usd} for user`,
        ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/crypto-callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`NOWPayments error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      payment_id: data.payment_id,
      pay_address: data.pay_address,
      pay_amount: data.pay_amount,
      pay_currency: data.pay_currency,
      expiration_estimate_date: data.expiration_estimate_date,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Crypto deposit error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
