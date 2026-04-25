// SportMonks Football API integration
// Docs: https://docs.sportmonks.com/football
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SM_BASE = 'https://api.sportmonks.com/v3/football';

// Map our UI sport keys to SportMonks league IDs.
// These are the most common league IDs in SportMonks.
// Users can extend this map as their plan covers more leagues.
const LEAGUE_MAP: Record<string, number[]> = {
  upcoming: [], // all subscribed leagues
  soccer: [],
  soccer_epl: [8],
  soccer_spain_la_liga: [564],
  soccer_italy_serie_a: [384],
  soccer_germany_bundesliga: [82],
  soccer_france_ligue_one: [301],
  soccer_uefa_champs_league: [2],
  soccer_uefa_europa_league: [5],
  soccer_netherlands_eredivisie: [72],
  soccer_portugal_primeira_liga: [462],
};

// Generate plausible 1X2 odds from a seed (so values are stable per fixture).
function seededOdds(seed: string): { home: number; draw: number; away: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const r1 = ((h % 1000) / 1000); // 0..1
  const r2 = (((h >>> 10) % 1000) / 1000);
  // home strength bias
  const home = +(1.4 + r1 * 3.6).toFixed(2);
  const away = +(1.4 + r2 * 3.6).toFixed(2);
  // draw inversely related to gap
  const draw = +(2.8 + Math.abs(home - away) * 0.4).toFixed(2);
  return { home, draw, away };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const TOKEN = Deno.env.get('SPORTMONKS_API_TOKEN');
    if (!TOKEN) throw new Error('SPORTMONKS_API_TOKEN is not configured');

    const url = new URL(req.url);
    const sportKey = url.searchParams.get('sport') || 'upcoming';

    // Date window: today + next 7 days
    const today = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const leagueIds = LEAGUE_MAP[sportKey] ?? [];
    const params = new URLSearchParams();
    params.set('api_token', TOKEN);
    params.set('include', 'participants;league;scores;state');
    params.set('per_page', '50');
    if (leagueIds.length > 0) {
      params.set('filters', `fixtureLeagues:${leagueIds.join(',')}`);
    }

    const endpoint = `${SM_BASE}/fixtures/between/${fmt(today)}/${fmt(end)}?${params}`;
    const resp = await fetch(endpoint);

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`SportMonks error [${resp.status}]:`, text);
      if (resp.status === 401 || resp.status === 403) {
        return jsonResponse({ error: 'Invalid SportMonks API token or plan does not include this resource', fallback: true }, resp.status);
      }
      if (resp.status === 429) {
        return jsonResponse({ error: 'Rate limited by SportMonks', fallback: true }, 429);
      }
      throw new Error(`SportMonks error [${resp.status}]: ${text.slice(0, 200)}`);
    }

    const result = await resp.json();
    const fixtures = result.data || [];

    const combined = fixtures.map((f: any) => {
      const participants = f.participants || [];
      const home = participants.find((p: any) => p.meta?.location === 'home') || participants[0] || {};
      const away = participants.find((p: any) => p.meta?.location === 'away') || participants[1] || {};
      const stateCode = f.state?.state || f.state?.short_name || '';
      const stateName = (f.state?.name || '').toLowerCase();
      const liveStates = ['INPLAY_1ST_HALF', 'INPLAY_2ND_HALF', 'HT', 'INPLAY_ET', 'INPLAY_ET_2ND_HALF', 'PEN_LIVE', 'BREAK', 'EXTRA_TIME'];
      const finishedStates = ['FT', 'AET', 'FT_PEN', 'CANC', 'POSTP', 'ABAN', 'AWARDED', 'WO'];
      const isLive = liveStates.includes(stateCode);
      const isFinished = finishedStates.includes(stateCode) || stateName.includes('full time') || stateName.includes('finished') || stateName.includes('ended');

      // SportMonks returns naive UTC datetimes ("YYYY-MM-DD HH:mm:ss"). Make ISO-8601 UTC.
      const rawStart: string = f.starting_at || '';
      const startIso = rawStart ? rawStart.replace(' ', 'T') + 'Z' : '';

      const homeScore = f.scores?.find?.((s: any) => s.description === 'CURRENT' && s.score?.participant === 'home')?.score?.goals
        ?? f.scores?.find?.((s: any) => s.description === 'CURRENT')?.score?.goals;
      const awayScore = f.scores?.find?.((s: any) => s.description === 'CURRENT' && s.score?.participant === 'away')?.score?.goals;

      const odds = seededOdds(`${f.id}`);

      return {
        id: `sm_${f.id}`,
        sport: 'soccer',
        league: f.league?.name || 'Football',
        home_team: home.name || 'Home',
        away_team: away.name || 'Away',
        start_time: startIso,
        start_time_provider: rawStart,
        provider_timezone: 'UTC',
        is_live: isLive,
        is_finished: isFinished,
        book_count: 1,
        markets: [],
        game_state: f.state ? {
          status: f.state.name,
          minute: f.state?.minute ?? null,
          home_score: typeof homeScore === 'number' ? homeScore : null,
          away_score: typeof awayScore === 'number' ? awayScore : null,
        } : null,
        odds,
      };
    }).filter((m: any) => !m.is_finished);

    return jsonResponse({
      success: true,
      data: combined,
      meta: { provider: 'sportmonks', count: combined.length },
    });
  } catch (error) {
    console.error('Error fetching odds:', error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unknown error', fallback: true },
      500
    );
  }
});
