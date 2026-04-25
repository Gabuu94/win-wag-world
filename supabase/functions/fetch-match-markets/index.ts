// SportMonks markets - generates expanded markets from a single fixture
// Since the Odds add-on is not enabled, we synthesize plausible markets locally.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SM_BASE = 'https://api.sportmonks.com/v3/football';

function seededOdds(seed: string): { home: number; draw: number; away: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const r1 = ((h % 1000) / 1000);
  const r2 = (((h >>> 10) % 1000) / 1000);
  const home = +(1.4 + r1 * 3.6).toFixed(2);
  const away = +(1.4 + r2 * 3.6).toFixed(2);
  const draw = +(2.8 + Math.abs(home - away) * 0.4).toFixed(2);
  return { home, draw, away };
}

function buildMarkets(fixtureId: string, homeName: string, awayName: string) {
  const o = seededOdds(fixtureId);
  const totals = seededOdds(fixtureId + 'totals');
  const btts = seededOdds(fixtureId + 'btts');

  const moneyline = [
    { id: `${fixtureId}_ml_home`, sportsbook: 'House', selection: homeName, selection_type: 'home', odds_decimal: o.home, line: null },
    { id: `${fixtureId}_ml_draw`, sportsbook: 'House', selection: 'Draw', selection_type: 'draw', odds_decimal: o.draw, line: null },
    { id: `${fixtureId}_ml_away`, sportsbook: 'House', selection: awayName, selection_type: 'away', odds_decimal: o.away, line: null },
  ];
  const totalsMarket = [
    { id: `${fixtureId}_o25`, sportsbook: 'House', selection: 'Over 2.5', selection_type: 'over', odds_decimal: totals.home, line: 2.5 },
    { id: `${fixtureId}_u25`, sportsbook: 'House', selection: 'Under 2.5', selection_type: 'under', odds_decimal: totals.away, line: 2.5 },
  ];
  const bttsMarket = [
    { id: `${fixtureId}_btts_yes`, sportsbook: 'House', selection: 'Yes', selection_type: 'yes', odds_decimal: btts.home, line: null },
    { id: `${fixtureId}_btts_no`, sportsbook: 'House', selection: 'No', selection_type: 'no', odds_decimal: btts.away, line: null },
  ];

  return {
    moneyline,
    totals: totalsMarket,
    btts: bttsMarket,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const TOKEN = Deno.env.get('SPORTMONKS_API_TOKEN');
    if (!TOKEN) throw new Error('SPORTMONKS_API_TOKEN is not configured');

    const url = new URL(req.url);
    const eventId = url.searchParams.get('event_id');
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'event_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Strip our "sm_" prefix to get the SportMonks fixture id
    const fxId = eventId.replace(/^sm_/, '');
    const fxResp = await fetch(`${SM_BASE}/fixtures/${fxId}?api_token=${TOKEN}&include=participants`);

    let homeName = 'Home';
    let awayName = 'Away';
    if (fxResp.ok) {
      const fxJson = await fxResp.json();
      const participants = fxJson.data?.participants || [];
      const home = participants.find((p: any) => p.meta?.location === 'home') || participants[0];
      const away = participants.find((p: any) => p.meta?.location === 'away') || participants[1];
      if (home?.name) homeName = home.name;
      if (away?.name) awayName = away.name;
    }

    const markets = buildMarkets(eventId, homeName, awayName);

    return new Response(JSON.stringify({ success: true, markets }), {
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
