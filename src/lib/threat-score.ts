import { supabase } from "./supabase";

export interface ThreatScoreComponent {
  name: string;
  score: number;
  maxScore: number;
  status: "normal" | "elevated" | "high";
  detail: string;
}

export interface ThreatScoreResult {
  total: number;
  level: "GREEN" | "YELLOW" | "RED";
  label: string;
  color: string;
  components: ThreatScoreComponent[];
  summary: string;
}

interface HistoryPoint {
  recorded_at: string;
  value: number;
}

async function getHistory(metricKey: string, days: number): Promise<HistoryPoint[]> {
  const { data, error } = await supabase.rpc("get_metric_history", {
    p_metric_key: metricKey,
    p_days: days,
  });
  if (error) return [];
  return (data || []) as HistoryPoint[];
}

function pctChange(history: HistoryPoint[]): number {
  if (history.length < 2) return 0;
  const latest = history[history.length - 1].value;
  const oldest = history[0].value;
  if (oldest === 0) return 0;
  return ((latest - oldest) / oldest) * 100;
}

function pctChange7d(history: HistoryPoint[]): number {
  if (history.length < 2) return 0;
  const latest = history[history.length - 1].value;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const old = history.find((h) => new Date(h.recorded_at) >= cutoff);
  const base = old ? old.value : history[0].value;
  if (base === 0) return 0;
  return ((latest - base) / base) * 100;
}

export async function computeThreatScore(): Promise<ThreatScoreResult> {
  const [wtiHist, brentHist, crackHist, dxyHist, tankerHist, sprHist, brentWtiHist] = await Promise.all([
    getHistory("wti_crude", 14),
    getHistory("brent_crude", 14),
    getHistory("crack_spread_321", 14),
    getHistory("dollar_index", 14),
    getHistory("tanker_index", 14),
    getHistory("spr_inventory", 30),
    getHistory("brent_wti_spread", 14),
  ]);

  const wti = wtiHist[wtiHist.length - 1]?.value ?? 0;
  const brent = brentHist[brentHist.length - 1]?.value ?? 0;
  const crack = crackHist[crackHist.length - 1]?.value ?? 0;
  const dxy = dxyHist[dxyHist.length - 1]?.value ?? 0;
  const tanker = tankerHist[tankerHist.length - 1]?.value ?? 0;
  const brentWti = brentWtiHist[brentWtiHist.length - 1]?.value ?? 0;

  const wti7d = pctChange7d(wtiHist);
  const tanker7d = pctChange7d(tankerHist);
  const sprChange = pctChange(sprHist);
  const dxy7d = pctChange7d(dxyHist);

  // ── Smooth scoring helpers ──
  // Linear interpolation: maps a value from [lo, hi] onto [outLo, outHi], clamped.
  function lerpScore(val: number, lo: number, hi: number, outLo: number, outHi: number): number {
    if (hi <= lo) return outLo;
    const t = Math.min(Math.max((val - lo) / (hi - lo), 0), 1);
    return Math.round(outLo + t * (outHi - outLo));
  }

  const components: ThreatScoreComponent[] = [];

  // 1. Oil Price Level (0-20)
  //    Smooth: $60 = 0, $90+ = 20, linear in between
  const oilScore = lerpScore(wti, 60, 90, 0, 20);
  components.push({
    name: "Oil Price Level",
    score: oilScore,
    maxScore: 20,
    status: oilScore >= 15 ? "high" : oilScore >= 10 ? "elevated" : "normal",
    detail: `WTI at $${wti.toFixed(2)}/bbl`,
  });

  // 2. Oil Price Momentum 7-day (0-15)
  //    Smooth: 0% change = 0, 12% change = 15, linear in between
  const momentumScore = lerpScore(Math.abs(wti7d), 0, 12, 0, 15);
  components.push({
    name: "Price Momentum (7d)",
    score: momentumScore,
    maxScore: 15,
    status: momentumScore >= 10 ? "high" : momentumScore >= 5 ? "elevated" : "normal",
    detail: `${wti7d >= 0 ? "+" : ""}${wti7d.toFixed(1)}% over 7 days`,
  });

  // 3. Brent-WTI Spread (0-15)
  //    Smooth: $1 = 0, $10 = 15, linear in between
  const spreadScore = lerpScore(brentWti, 1, 10, 0, 15);
  components.push({
    name: "Brent-WTI Spread",
    score: spreadScore,
    maxScore: 15,
    status: spreadScore >= 10 ? "high" : spreadScore >= 5 ? "elevated" : "normal",
    detail: `$${brentWti.toFixed(2)}/bbl spread (Mid-East risk premium)`,
  });

  // 4. Tanker Shipping Index 7-day change (0-20)
  //    Smooth: 0% = 0, 12% = 20, linear in between
  const tankerScore = lerpScore(Math.abs(tanker7d), 0, 12, 0, 20);
  components.push({
    name: "Tanker Shipping Stress",
    score: tankerScore,
    maxScore: 20,
    status: tankerScore >= 14 ? "high" : tankerScore >= 7 ? "elevated" : "normal",
    detail: `${tanker7d >= 0 ? "+" : ""}${tanker7d.toFixed(1)}% tanker index over 7 days`,
  });

  // 5. Crack Spread Level (0-10)
  //    Smooth: $20 = 0, $60 = 10, linear in between
  const crackScore = lerpScore(crack, 20, 60, 0, 10);
  components.push({
    name: "Refining Margin Stress",
    score: crackScore,
    maxScore: 10,
    status: crackScore >= 6 ? "high" : crackScore >= 3 ? "elevated" : "normal",
    detail: `3:2:1 crack spread at $${crack.toFixed(2)}/bbl`,
  });

  // 6. Dollar Divergence (0-10)
  //    Oil rising while DXY also rising = unusual stress (oil should fall with strong dollar)
  //    Smooth: score scales with the product of both divergences
  //    Divergence factor = min(wti7d/5, 1) × min(dxy7d/2, 1), then ×10
  let dxyScore = 0;
  if (wti7d > 0 && dxy7d > 0) {
    const wtiFactor = Math.min(wti7d / 5, 1);
    const dxyFactor = Math.min(dxy7d / 2, 1);
    dxyScore = Math.round(wtiFactor * dxyFactor * 10);
  }
  components.push({
    name: "Dollar Divergence",
    score: dxyScore,
    maxScore: 10,
    status: dxyScore >= 7 ? "high" : dxyScore >= 4 ? "elevated" : "normal",
    detail: dxyScore > 0
      ? `Oil +${wti7d.toFixed(1)}% while DXY ${dxy7d >= 0 ? "+" : ""}${dxy7d.toFixed(1)}% (divergence)`
      : `No divergence — DXY ${dxy7d >= 0 ? "+" : ""}${dxy7d.toFixed(1)}%, WTI ${wti7d >= 0 ? "+" : ""}${wti7d.toFixed(1)}%`,
  });

  // 7. SPR Trend 30-day (0-10)
  //    Smooth: +2% (rising) = 0, -8% (drawdown) = 10, linear in between
  //    Rising SPR = 0, flat = ~2, declining = scales up
  const sprScore = sprHist.length > 1
    ? lerpScore(sprChange, 2, -8, 0, 10)
    : 0;
  components.push({
    name: "SPR Drawdown",
    score: sprScore,
    maxScore: 10,
    status: sprScore >= 6 ? "high" : sprScore >= 3 ? "elevated" : "normal",
    detail: sprHist.length > 1
      ? `SPR ${sprChange >= 0 ? "+" : ""}${sprChange.toFixed(1)}% over 30 days`
      : "No SPR history available",
  });

  const total = components.reduce((sum, c) => sum + c.score, 0);

  let level: "GREEN" | "YELLOW" | "RED";
  let label: string;
  let color: string;

  if (total >= 66) {
    level = "RED";
    label = "ELEVATED";
    color = "#f85149";
  } else if (total >= 36) {
    level = "YELLOW";
    label = "GUARDED";
    color = "#f0b429";
  } else {
    level = "GREEN";
    label = "LOW";
    color = "#3fb950";
  }

  // Build summary
  const elevatedCount = components.filter((c) => c.status === "elevated").length;
  const highCount = components.filter((c) => c.status === "high").length;
  const summaryParts = components
    .filter((c) => c.score > 0)
    .map((c) => `${c.name}: ${c.score}/${c.maxScore}`)
    .join(" · ");
  const summary = `Score ${total}/100 (${highCount} high, ${elevatedCount} elevated). ${summaryParts}`;

  return { total, level, label, color, components, summary };
}
