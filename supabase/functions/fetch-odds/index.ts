import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    const markets = url.searchParams.get('markets') || 'h2h';

    let apiUrl: string;

    if (sport === 'sports') {
      // List available sports
      apiUrl = `https://api.the-odds-api.com/v4/sports/?apiKey=${API_KEY}`;
    } else if (sport === 'scores') {
      // Live scores
      const sportKey = url.searchParams.get('sportKey') || 'upcoming';
      apiUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${API_KEY}&daysFrom=1`;
    } else {
      // Odds for a specific sport or upcoming
      apiUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=${regions}&markets=${markets}&oddsFormat=decimal`;
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
      const text = await response.text();
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
