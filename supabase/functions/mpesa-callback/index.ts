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

    const { status, amount, api_ref, mpesa_code, checkout_id, phone_number } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (status === 'payment.success' && api_ref?.user_id) {
      const userId = api_ref.user_id;
      const amt = Number(amount);

      // 1. Credit the wallet
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return new Response(JSON.stringify({ received: true, note: 'no profile' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const newBalance = Number(profile.balance) + amt;
      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      // 2. Update the most recent matching PENDING transaction so the
      //    realtime UPDATE event reaches the deposit modal.
      const phoneRef = phone_number ? String(phone_number) : null;
      const { data: pendingRows } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'deposit')
        .eq('method', 'mpesa')
        .eq('status', 'pending')
        .eq('amount', amt)
        .order('created_at', { ascending: false })
        .limit(1);

      const pending = pendingRows?.[0];

      if (pending) {
        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            reference: mpesa_code || checkout_id || phoneRef,
          })
          .eq('id', pending.id);
      } else {
        // Fallback: no pending row found — insert a completed one
        await supabase.from('transactions').insert({
          user_id: userId,
          type: 'deposit',
          method: 'mpesa',
          amount: amt,
          status: 'completed',
          reference: mpesa_code || checkout_id || null,
        });
      }

      // 3. Notify the user
      await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Deposit Successful',
        message: `KES ${amt} has been added to your wallet.`,
        type: 'deposit',
      });

      console.log(`Deposited KES ${amount} for user ${userId}. Mpesa code: ${mpesa_code}`);
    } else if (status === 'payment.failed' && api_ref?.user_id) {
      const userId = api_ref.user_id;
      const amt = Number(amount);

      const { data: pendingRows } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'deposit')
        .eq('method', 'mpesa')
        .eq('status', 'pending')
        .eq('amount', amt)
        .order('created_at', { ascending: false })
        .limit(1);

      const pending = pendingRows?.[0];
      if (pending) {
        await supabase
          .from('transactions')
          .update({
            status: 'failed',
            reference: checkout_id || null,
          })
          .eq('id', pending.id);
      } else {
        await supabase.from('transactions').insert({
          user_id: userId,
          type: 'deposit',
          method: 'mpesa',
          amount: amt,
          status: 'failed',
          reference: checkout_id || null,
        });
      }
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
