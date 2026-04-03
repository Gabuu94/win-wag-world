const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHARPAPI_BASE = 'https://api.sharpapi.io/api/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('SHARPAPI_KEY');
    if (!API_KEY) throw new Error('SHARPAPI_KEY is not configured');

    const url = new URL(req.url);
    const eventId = url.searchParams.get('event_id');
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'event_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all odds for this event across all market types
    const params = new URLSearchParams();
    params.set('event', eventId);
    params.set('market', 'main');
    params.set('limit', '200');

    const oddsResp = await fetch(`${SHARPAPI_BASE}/odds?${params}`, {
      headers: { 'X-API-Key': API_KEY },
    });

    if (!oddsResp.ok) {
      const text = await oddsResp.text();
      console.error(`SharpAPI markets error [${oddsResp.status}]:`, text);
      return new Response(JSON.stringify({ error: 'Failed to fetch markets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await oddsResp.json();
    const oddsData = result.data || [];

    // Group odds by market_type
    const marketGroups: Record<string, any[]> = {};
    
    // Handle both flat array and grouped responses
    const flatOdds = Array.isArray(oddsData) 
      ? oddsData.flatMap((item: any) => item.odds ? item.odds : [item])
      : [];

    for (const odd of flatOdds) {
      const mtype = odd.market_type || 'moneyline';
      if (!marketGroups[mtype]) marketGroups[mtype] = [];
      marketGroups[mtype].push({
        id: odd.id,
        sportsbook: odd.sportsbook,
        selection: odd.selection,
        selection_type: odd.selection_type,
        odds_decimal: odd.odds_decimal,
        odds_american: odd.odds_american,
        line: odd.line,
        player_name: odd.player_name,
      });
    }

    return new Response(JSON.stringify({ success: true, markets: marketGroups }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
