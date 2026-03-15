const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sports that only support outrights, not h2h
const OUTRIGHT_SPORTS = ['golf_', 'politics_', '_winner', '_championship'];

function isOutrightSport(sport: string): boolean {
  return OUTRIGHT_SPORTS.some((s) => sport.includes(s));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('THE_ODDS_API_KEY');
    if (!API_KEY) {
      throw new Error('THE_ODDS_API_KEY is not configured');
    }

    const url = new URL(req.url);
    const sport = url.searchParams.get('sport') || 'upcoming';
    const regions = url.searchParams.get('regions') || 'us,eu,uk';
    const requestedMarkets = url.searchParams.get('markets') || 'h2h';

    let apiUrl: string;

    if (sport === 'sports') {
      apiUrl = `https://api.the-odds-api.com/v4/sports/?apiKey=${API_KEY}`;
    } else {
      // Use outrights for sports that don't support h2h
      const markets = isOutrightSport(sport) ? 'outrights' : requestedMarkets;
      apiUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=decimal`;
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
      const text = await response.text();
      // If market combo is invalid, retry with outrights
      if (response.status === 422 && text.includes('INVALID_MARKET_COMBO')) {
        const fallbackUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=${regions}&markets=outrights&oddsFormat=decimal`;
        const fallbackResp = await fetch(fallbackUrl);
        if (fallbackResp.ok) {
          const data = await fallbackResp.json();
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        // If outrights also fails, return empty array
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Odds API error [${response.status}]: ${text}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching odds:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
