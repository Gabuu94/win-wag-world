const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHARPAPI_BASE = 'https://api.sharpapi.io/api/v1';

// Map our sidebar sport keys to SharpAPI league/sport params
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

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('SHARPAPI_KEY');
    if (!API_KEY) {
      throw new Error('SHARPAPI_KEY is not configured');
    }

    const url = new URL(req.url);
    const sportKey = url.searchParams.get('sport') || 'upcoming';

    // If requesting the sports list
    if (sportKey === 'sports') {
      const resp = await fetch(`${SHARPAPI_BASE}/sports`, {
        headers: { 'X-API-Key': API_KEY },
      });
      const data = await resp.json();
      return jsonResponse(data);
    }

    const { sport, league } = mapSportKey(sportKey);

    // Build query params for the events endpoint (grouped with odds)
    const params = new URLSearchParams();
    if (sport) params.set('sport', sport);
    if (league) params.set('league', league);
    params.set('limit', '100');

    // Fetch events
    const eventsResp = await fetch(`${SHARPAPI_BASE}/events?${params}`, {
      headers: { 'X-API-Key': API_KEY },
    });

    if (!eventsResp.ok) {
      const text = await eventsResp.text();
      console.error(`SharpAPI events error [${eventsResp.status}]:`, text);
      
      if (eventsResp.status === 429) {
        return jsonResponse({ error: 'Rate limited', fallback: true }, 429);
      }
      throw new Error(`SharpAPI error [${eventsResp.status}]: ${text}`);
    }

    const eventsResult = await eventsResp.json();
    const events = eventsResult.data || [];

    // Now fetch odds for these events (grouped by event for easy matching)
    const oddsParams = new URLSearchParams();
    if (sport) oddsParams.set('sport', sport);
    if (league) oddsParams.set('league', league);
    oddsParams.set('market', 'main');
    oddsParams.set('group_by', 'event');
    oddsParams.set('limit', '200');

    const oddsResp = await fetch(`${SHARPAPI_BASE}/odds?${oddsParams}`, {
      headers: { 'X-API-Key': API_KEY },
    });

    let oddsGrouped: Record<string, any[]> = {};

    if (oddsResp.ok) {
      const oddsResult = await oddsResp.json();
      const oddsData = oddsResult.data || [];
      
      // Build a map from event_id to odds array
      for (const group of oddsData) {
        if (group.event_id && group.odds) {
          oddsGrouped[group.event_id] = group.odds;
        }
      }
    }

    // Combine events + odds into a unified response
    const combined = events.map((ev: any) => {
      const eventOdds = oddsGrouped[ev.id] || [];
      
      // Extract moneyline odds (prefer first sportsbook available)
      const moneylineOdds = eventOdds.filter((o: any) => o.market_type === 'moneyline');
      const homeOdds = moneylineOdds.find((o: any) => o.selection_type === 'home');
      const awayOdds = moneylineOdds.find((o: any) => o.selection_type === 'away');
      
      // For draw (soccer, etc.)
      const drawOdds = moneylineOdds.find((o: any) => 
        o.selection === 'Draw' || o.selection_type === 'draw'
      );

      return {
        id: ev.id,
        sport: ev.sport,
        league: ev.league,
        home_team: ev.home_team,
        away_team: ev.away_team,
        start_time: ev.start_time,
        is_live: ev.is_live || ev.status === 'live',
        book_count: ev.book_count || 1,
        markets: ev.markets || [],
        game_state: ev.game_state || null,
        odds: {
          home: homeOdds?.odds_decimal || null,
          away: awayOdds?.odds_decimal || null,
          draw: drawOdds?.odds_decimal || null,
          home_american: homeOdds?.odds_american || null,
          away_american: awayOdds?.odds_american || null,
          draw_american: drawOdds?.odds_american || null,
        },
      };
    });

    return jsonResponse({ 
      success: true, 
      data: combined,
      meta: eventsResult.meta || {},
    });
  } catch (error) {
    console.error('Error fetching odds:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unknown error', fallback: true },
      500
    );
  }
});
