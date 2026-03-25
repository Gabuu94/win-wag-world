import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Crypto callback received:', JSON.stringify(body));

    const { payment_status, order_id, price_amount } = body;

    // NOWPayments statuses: waiting, confirming, confirmed, sending, partially_paid, finished, failed, refunded, expired
    if ((payment_status === 'finished' || payment_status === 'confirmed') && order_id) {
      // Extract user_id from order_id format: deposit_{user_id}_{timestamp}
      const parts = order_id.split('_');
      if (parts.length >= 2) {
        const user_id = parts[1];

        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        const { data: profile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('user_id', user_id)
          .single();

        if (profile) {
          const newBalance = Number(profile.balance) + Number(price_amount);
          await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('user_id', user_id);

          console.log(`Crypto deposit: $${price_amount} credited to user ${user_id}`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Crypto callback error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
