const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHARPAPI_BASE = 'https://api.sharpapi.io/api/v1';

function mapSportKey(key: string): { sport?: string; league?: string } {
  const map: Record<string, { sport?: string; league?: string }> = {
    upcoming: {},
    soccer: { sport: 'soccer' },
    soccer_epl: { league: 'epl' },
    soccer_spain_la_liga: { league: 'la_liga' },
    soccer_italy_serie_a: { league: 'serie_a' },
    soccer_germany_bundesliga: { league: 'bundesliga' },
    soccer_france_ligue_one: { league: 'ligue_1' },
    soccer_uefa_champs_league: { league: 'ucl' },
    basketball_nba: { league: 'nba' },
    basketball_euroleague: { league: 'euroleague' },
    icehockey_nhl: { league: 'nhl' },
    americanfootball_nfl: { league: 'nfl' },
    baseball_mlb: { league: 'mlb' },
    mma_mixed_martial_arts: { sport: 'mma' },
    tennis_atp_french_open: { sport: 'tennis' },
    tennis_wta_french_open: { sport: 'tennis' },
    rugbyleague_nrl: { league: 'nrl' },
    aussierules_afl: { league: 'afl' },
    cricket_test_match: { sport: 'cricket' },
    boxing_boxing: { sport: 'boxing' },
    golf_masters_tournament_winner: { sport: 'golf' },
  };
  return map[key] || {};
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('SHARPAPI_KEY');
    if (!API_KEY) {
      throw new Error('SHARPAPI_KEY is not configured');
    }

    const url = new URL(req.url);
    const sportKey = url.searchParams.get('sport') || 'upcoming';
    const headers = { 'X-API-Key': API_KEY };

    if (sportKey === 'sports') {
      const resp = await fetch(`${SHARPAPI_BASE}/sports`, { headers });
      const data = await resp.json();
      return jsonResponse(data);
    }

    const { sport, league } = mapSportKey(sportKey);

    // Fetch odds directly with moneyline market, grouped by event
    // This gives us events + odds in one call
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (league) params.set('league', league);
    params.set('market', 'moneyline');
    params.set('group_by', 'event');
    params.set('limit', '200');

    const oddsResp = await fetch(`${SHARPAPI_BASE}/odds?${params}`, { headers });

    if (!oddsResp.ok) {
      const text = await oddsResp.text();
      console.error(`SharpAPI error [${oddsResp.status}]:`, text);

      if (oddsResp.status === 429) {
        return jsonResponse({ error: 'Rate limited', fallback: true }, 429);
      }
      throw new Error(`SharpAPI error [${oddsResp.status}]: ${text}`);
    }

    const oddsResult = await oddsResp.json();
    const grouped = oddsResult.data || [];

    // Transform grouped odds into our event format
    const combined = grouped
      .filter((g: any) => g.event_id && g.odds && g.odds.length > 0)
      .map((g: any) => {
        const odds = g.odds || [];
        const homeOdds = odds.find((o: any) => o.selection_type === 'home');
        const awayOdds = odds.find((o: any) => o.selection_type === 'away');
        const drawOdds = odds.find((o: any) => o.selection === 'Draw' || o.selection_type === 'draw');

        // Parse teams from event_name or from odds selections
        const homeName = homeOdds?.home_team || odds[0]?.home_team || g.event_name?.split(' vs ')?.[0] || 'Home';
        const awayName = awayOdds?.away_team || odds[0]?.away_team || g.event_name?.split(' vs ')?.[1] || 'Away';

        return {
          id: g.event_id,
          sport: g.sport || odds[0]?.sport || '',
          league: g.league || odds[0]?.league || '',
          home_team: homeName,
          away_team: awayName,
          start_time: g.start_time || odds[0]?.event_start_time || '',
          is_live: g.is_live ?? odds[0]?.is_live ?? false,
          book_count: new Set(odds.map((o: any) => o.sportsbook)).size,
          markets: [],
          game_state: null,
          odds: {
            home: homeOdds?.odds_decimal || null,
            away: awayOdds?.odds_decimal || null,
            draw: drawOdds?.odds_decimal || null,
          },
        };
      });

    return jsonResponse({
      success: true,
      data: combined,
      meta: oddsResult.meta || {},
    });
  } catch (error) {
    console.error('Error fetching odds:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unknown error', fallback: true },
      500
    );
  }
});
