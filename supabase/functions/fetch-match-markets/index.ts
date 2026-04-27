// Generate a comprehensive, seeded market set for a fixture so values are stable.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SM_BASE = 'https://api.sportmonks.com/v3/football';

// Mulberry32 seeded PRNG for reproducible odds
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const round2 = (n: number) => Math.max(1.01, Math.round(n * 100) / 100);

function build1x2(rng: () => number) {
  const home = round2(1.4 + rng() * 3.2);
  const away = round2(1.4 + rng() * 3.2);
  const draw = round2(2.8 + Math.abs(home - away) * 0.4);
  return { home, draw, away };
}

interface Sel {
  id: string;
  sportsbook: string;
  selection: string;
  selection_type: string;
  odds_decimal: number;
  line: number | null;
}

function buildMarkets(fixtureId: string, homeName: string, awayName: string): Record<string, Sel[]> {
  const baseSeed = seedFrom(fixtureId);
  const rng = mulberry32(baseSeed);
  const ml = build1x2(rng);
  const htMl = build1x2(mulberry32(baseSeed ^ 0x11));
  const shMl = build1x2(mulberry32(baseSeed ^ 0x22));

  const markets: Record<string, Sel[]> = {};
  const mk = (key: string, sels: Omit<Sel, 'id' | 'sportsbook'>[]) => {
    markets[key] = sels.map((s, i) => ({
      id: `${fixtureId}_${key}_${i}`,
      sportsbook: 'House',
      ...s,
    }));
  };

  // 1X2
  mk('moneyline', [
    { selection: homeName, selection_type: 'home', odds_decimal: ml.home, line: null },
    { selection: 'Draw', selection_type: 'draw', odds_decimal: ml.draw, line: null },
    { selection: awayName, selection_type: 'away', odds_decimal: ml.away, line: null },
  ]);

  // Double Chance
  const dc1x = round2(1 / (1 / ml.home + 1 / ml.draw) * 0.95);
  const dc12 = round2(1 / (1 / ml.home + 1 / ml.away) * 0.95);
  const dcx2 = round2(1 / (1 / ml.draw + 1 / ml.away) * 0.95);
  mk('double_chance', [
    { selection: `${homeName} or Draw`, selection_type: '1X', odds_decimal: dc1x, line: null },
    { selection: `${homeName} or ${awayName}`, selection_type: '12', odds_decimal: dc12, line: null },
    { selection: `Draw or ${awayName}`, selection_type: 'X2', odds_decimal: dcx2, line: null },
  ]);

  // Over/Under goals 1.5 - 6.5
  const ouSels: Omit<Sel, 'id' | 'sportsbook'>[] = [];
  for (const line of [1.5, 2.5, 3.5, 4.5, 5.5, 6.5]) {
    const r = mulberry32(baseSeed ^ Math.floor(line * 100))();
    const overBase = 1.3 + (line - 1.5) * 0.6 + r * 0.4;
    const underBase = 4.5 - (line - 1.5) * 0.55 - r * 0.3;
    ouSels.push({ selection: `Over ${line}`, selection_type: 'over', odds_decimal: round2(overBase), line });
    ouSels.push({ selection: `Under ${line}`, selection_type: 'under', odds_decimal: round2(underBase), line });
  }
  mk('total_goals', ouSels);

  // BTTS
  const bttsRng = mulberry32(baseSeed ^ 0x33);
  mk('btts', [
    { selection: 'Yes', selection_type: 'yes', odds_decimal: round2(1.6 + bttsRng() * 0.5), line: null },
    { selection: 'No', selection_type: 'no', odds_decimal: round2(1.7 + bttsRng() * 0.5), line: null },
  ]);

  // Correct Score 0-0..4-4 + Any Other
  const csSels: Omit<Sel, 'id' | 'sportsbook'>[] = [];
  for (let h = 0; h <= 4; h++) {
    for (let a = 0; a <= 4; a++) {
      const r = mulberry32(baseSeed ^ ((h + 1) * 31 + (a + 1)))();
      const base = 6 + (h + a) * 4 + Math.abs(h - a) * 3 + r * 8;
      csSels.push({ selection: `${h} - ${a}`, selection_type: `${h}_${a}`, odds_decimal: round2(base), line: null });
    }
  }
  csSels.push({ selection: 'Any Other Score', selection_type: 'other', odds_decimal: round2(15 + mulberry32(baseSeed ^ 0x99)() * 10), line: null });
  mk('correct_score', csSels);

  // Team Total Goals — Home
  const ttHome: Omit<Sel, 'id' | 'sportsbook'>[] = [];
  for (const line of [0.5, 1.5, 2.5, 3.5]) {
    const r = mulberry32(baseSeed ^ Math.floor(line * 1000) ^ 0xaa)();
    ttHome.push({ selection: `${homeName} Over ${line}`, selection_type: 'home_over', odds_decimal: round2(1.4 + line * 0.7 + r * 0.4), line });
    ttHome.push({ selection: `${homeName} Under ${line}`, selection_type: 'home_under', odds_decimal: round2(3.5 - line * 0.4 + r * 0.3), line });
  }
  mk('team_total_home', ttHome);

  // Team Total Goals — Away
  const ttAway: Omit<Sel, 'id' | 'sportsbook'>[] = [];
  for (const line of [0.5, 1.5, 2.5, 3.5]) {
    const r = mulberry32(baseSeed ^ Math.floor(line * 1000) ^ 0xbb)();
    ttAway.push({ selection: `${awayName} Over ${line}`, selection_type: 'away_over', odds_decimal: round2(1.4 + line * 0.7 + r * 0.4), line });
    ttAway.push({ selection: `${awayName} Under ${line}`, selection_type: 'away_under', odds_decimal: round2(3.5 - line * 0.4 + r * 0.3), line });
  }
  mk('team_total_away', ttAway);

  // Half-Time Result
  mk('ht_result', [
    { selection: homeName, selection_type: 'home', odds_decimal: htMl.home, line: null },
    { selection: 'Draw', selection_type: 'draw', odds_decimal: htMl.draw, line: null },
    { selection: awayName, selection_type: 'away', odds_decimal: htMl.away, line: null },
  ]);

  // Second-Half Result
  mk('sh_result', [
    { selection: homeName, selection_type: 'home', odds_decimal: shMl.home, line: null },
    { selection: 'Draw', selection_type: 'draw', odds_decimal: shMl.draw, line: null },
    { selection: awayName, selection_type: 'away', odds_decimal: shMl.away, line: null },
  ]);

  // HT/FT combinations
  const sides = [
    { code: '1', name: homeName },
    { code: 'X', name: 'Draw' },
    { code: '2', name: awayName },
  ];
  const htft: Omit<Sel, 'id' | 'sportsbook'>[] = [];
  for (const ht of sides) for (const ft of sides) {
    const r = mulberry32(baseSeed ^ seedFrom(ht.code + ft.code))();
    htft.push({
      selection: `${ht.name} / ${ft.name}`,
      selection_type: `${ht.code}${ft.code}`,
      odds_decimal: round2(3 + r * 18 + (ht.code !== ft.code ? 6 : 0)),
      line: null,
    });
  }
  mk('ht_ft', htft);

  // Total Corners O/U
  const corners: Omit<Sel, 'id' | 'sportsbook'>[] = [];
  for (const line of [7.5, 8.5, 9.5, 10.5, 11.5]) {
    const r = mulberry32(baseSeed ^ Math.floor(line * 10) ^ 0xcc)();
    corners.push({ selection: `Over ${line}`, selection_type: 'over', odds_decimal: round2(1.5 + (line - 7.5) * 0.3 + r * 0.4), line });
    corners.push({ selection: `Under ${line}`, selection_type: 'under', odds_decimal: round2(2.4 - (line - 7.5) * 0.2 + r * 0.3), line });
  }
  mk('total_corners', corners);

  // Total Cards O/U
  const cards: Omit<Sel, 'id' | 'sportsbook'>[] = [];
  for (const line of [2.5, 3.5, 4.5, 5.5]) {
    const r = mulberry32(baseSeed ^ Math.floor(line * 10) ^ 0xdd)();
    cards.push({ selection: `Over ${line}`, selection_type: 'over', odds_decimal: round2(1.5 + (line - 2.5) * 0.4 + r * 0.4), line });
    cards.push({ selection: `Under ${line}`, selection_type: 'under', odds_decimal: round2(2.5 - (line - 2.5) * 0.3 + r * 0.3), line });
  }
  mk('total_cards', cards);

  // Shots on Target O/U
  const sot: Omit<Sel, 'id' | 'sportsbook'>[] = [];
  for (const line of [7.5, 8.5, 9.5, 10.5]) {
    const r = mulberry32(baseSeed ^ Math.floor(line * 10) ^ 0xee)();
    sot.push({ selection: `Over ${line}`, selection_type: 'over', odds_decimal: round2(1.6 + (line - 7.5) * 0.3 + r * 0.4), line });
    sot.push({ selection: `Under ${line}`, selection_type: 'under', odds_decimal: round2(2.3 - (line - 7.5) * 0.2 + r * 0.3), line });
  }
  mk('shots_on_target', sot);

  // First Team to Score
  const fstRng = mulberry32(baseSeed ^ 0x44);
  mk('first_to_score', [
    { selection: homeName, selection_type: 'home', odds_decimal: round2(1.7 + fstRng() * 0.5), line: null },
    { selection: awayName, selection_type: 'away', odds_decimal: round2(2.0 + fstRng() * 0.6), line: null },
    { selection: 'No Goal', selection_type: 'none', odds_decimal: round2(8 + fstRng() * 4), line: null },
  ]);

  // Last Team to Score
  const lstRng = mulberry32(baseSeed ^ 0x55);
  mk('last_to_score', [
    { selection: homeName, selection_type: 'home', odds_decimal: round2(1.8 + lstRng() * 0.5), line: null },
    { selection: awayName, selection_type: 'away', odds_decimal: round2(2.0 + lstRng() * 0.6), line: null },
    { selection: 'No Goal', selection_type: 'none', odds_decimal: round2(8 + lstRng() * 4), line: null },
  ]);

  // Win to Nil
  const wtnRng = mulberry32(baseSeed ^ 0x66);
  mk('win_to_nil', [
    { selection: `${homeName} Win to Nil`, selection_type: 'home', odds_decimal: round2(3.2 + wtnRng() * 1.5), line: null },
    { selection: `${awayName} Win to Nil`, selection_type: 'away', odds_decimal: round2(4.0 + wtnRng() * 1.5), line: null },
  ]);

  // Clean Sheet
  const csRng = mulberry32(baseSeed ^ 0x77);
  mk('clean_sheet', [
    { selection: `${homeName} Clean Sheet`, selection_type: 'home', odds_decimal: round2(2.4 + csRng() * 1.0), line: null },
    { selection: `${awayName} Clean Sheet`, selection_type: 'away', odds_decimal: round2(3.0 + csRng() * 1.2), line: null },
  ]);

  return markets;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const TOKEN = Deno.env.get('SPORTMONKS_API_TOKEN');
    const url = new URL(req.url);
    const eventId = url.searchParams.get('event_id');
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'event_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fxId = eventId.replace(/^sm_/, '');
    let homeName = 'Home';
    let awayName = 'Away';
    if (TOKEN) {
      try {
        const fxResp = await fetch(`${SM_BASE}/fixtures/${fxId}?api_token=${TOKEN}&include=participants`);
        if (fxResp.ok) {
          const fxJson = await fxResp.json();
          const participants = fxJson.data?.participants || [];
          const home = participants.find((p: any) => p.meta?.location === 'home') || participants[0];
          const away = participants.find((p: any) => p.meta?.location === 'away') || participants[1];
          if (home?.name) homeName = home.name;
          if (away?.name) awayName = away.name;
        }
      } catch { /* keep defaults */ }
    }

    const markets = buildMarkets(eventId, homeName, awayName);
    return new Response(JSON.stringify({ success: true, markets, market_count: Object.keys(markets).length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
