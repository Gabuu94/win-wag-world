import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-nowpayments-sig',
};

// Sort object keys recursively (NOWPayments requires sorted JSON for HMAC)
function sortObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(sortObject);
  if (obj && typeof obj === 'object') {
    return Object.keys(obj).sort().reduce((acc: any, key) => {
      acc[key] = sortObject(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(rawBody);
    const sortedJson = JSON.stringify(sortObject(parsed));
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sortedJson));
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === signature.toLowerCase();
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-nowpayments-sig');
    const ipnSecret = Deno.env.get('NOWPAYMENTS_IPN_SECRET');

    // Verify HMAC signature when secret is configured
    if (ipnSecret) {
      if (!signature) {
        console.warn('Missing x-nowpayments-sig header');
        return new Response(JSON.stringify({ error: 'Missing signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const valid = await verifySignature(rawBody, signature, ipnSecret);
      if (!valid) {
        console.warn('Invalid IPN signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = JSON.parse(rawBody);
    console.log('Crypto callback received:', JSON.stringify(body));

    const { payment_status, order_id, price_amount } = body;

    if ((payment_status === 'finished' || payment_status === 'confirmed') && order_id) {
      const parts = order_id.split('_');
      if (parts.length >= 2) {
        const user_id = parts[1];

        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );

        const { data: profile } = await supabase
          .from('profiles')
          .select('balance, welcome_bonus_claimed')
          .eq('user_id', user_id)
          .single();

        if (profile) {
          const amt = Number(price_amount);
          const isFirstDeposit = !profile.welcome_bonus_claimed;
          const bonus = isFirstDeposit ? Math.round(amt * 0.5 * 100) / 100 : 0;
          const newBalance = Number(profile.balance) + amt + bonus;

          await supabase
            .from('profiles')
            .update({
              balance: newBalance,
              ...(isFirstDeposit ? { welcome_bonus_claimed: true } : {}),
            })
            .eq('user_id', user_id);

          await supabase.from('transactions').insert({
            user_id,
            type: 'deposit',
            method: 'crypto',
            amount: amt,
            status: 'completed',
            reference: order_id,
          });

          if (bonus > 0) {
            await supabase.from('transactions').insert({
              user_id,
              type: 'deposit',
              method: 'bonus',
              amount: bonus,
              status: 'completed',
              reference: `WELCOME50-${order_id}`,
              metadata: { source: 'welcome_bonus', deposit_amount: amt },
            });
            await supabase.from('notifications').insert({
              user_id,
              title: 'Welcome Bonus Credited',
              message: `Your 50% first-deposit bonus of $${bonus} has been added to your wallet!`,
              type: 'bonus',
            });
          }

          console.log(`Crypto deposit: $${amt} + $${bonus} bonus credited to user ${user_id}`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Crypto callback error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
