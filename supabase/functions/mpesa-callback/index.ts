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
    console.log('Mpesa callback received:', JSON.stringify(body));

    const { status, amount, api_ref, mpesa_code, checkout_id } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (status === 'payment.success' && api_ref?.user_id) {
      // Get current balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('user_id', api_ref.user_id)
        .single();

      if (profile) {
        const newBalance = Number(profile.balance) + Number(amount);
        await supabase
          .from('profiles')
          .update({ balance: newBalance })
          .eq('user_id', api_ref.user_id);

        // Record completed transaction
        await supabase.from('transactions').insert({
          user_id: api_ref.user_id,
          type: 'deposit',
          method: 'mpesa',
          amount: Number(amount),
          status: 'completed',
          reference: mpesa_code || checkout_id || null,
        });

        console.log(`Deposited KES ${amount} for user ${api_ref.user_id}. Mpesa code: ${mpesa_code}`);
      }
    } else if (status === 'payment.failed' && api_ref?.user_id) {
      // Record failed transaction
      await supabase.from('transactions').insert({
        user_id: api_ref.user_id,
        type: 'deposit',
        method: 'mpesa',
        amount: Number(amount),
        status: 'failed',
        reference: checkout_id || null,
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Callback error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
