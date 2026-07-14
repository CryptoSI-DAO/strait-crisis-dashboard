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

  const components: ThreatScoreComponent[] = [];

  // 1. Oil Price Level (0-20)
  //    < $65 = 0, $65-70 = 5, $70-80 = 10, $80-85 = 15, > $85 = 20
  let oilScore = 0;
  if (wti >= 85) oilScore = 20;
  else if (wti >= 80) oilScore = 15;
  else if (wti >= 70) oilScore = 10;
  else if (wti >= 65) oilScore = 5;
  components.push({
    name: "Oil Price Level",
    score: oilScore,
    maxScore: 20,
    status: oilScore >= 15 ? "high" : oilScore >= 10 ? "elevated" : "normal",
    detail: `WTI at $${wti.toFixed(2)}/bbl`,
  });

  // 2. Oil Price Momentum 7-day (0-15)
  //    < +2% = 0, 2-5% = 5, 5-10% = 10, > 10% = 15
  let momentumScore = 0;
  if (wti7d > 10) momentumScore = 15;
  else if (wti7d > 5) momentumScore = 10;
  else if (wti7d > 2) momentumScore = 5;
  components.push({
    name: "Price Momentum (7d)",
    score: momentumScore,
    maxScore: 15,
    status: momentumScore >= 10 ? "high" : momentumScore >= 5 ? "elevated" : "normal",
    detail: `${wti7d >= 0 ? "+" : ""}${wti7d.toFixed(1)}% over 7 days`,
  });

  // 3. Brent-WTI Spread (0-15)
  //    < $3 = 0, $3-5 = 5, $5-8 = 10, > $8 = 15
  //    Wide spread = Middle East supply risk premium
  let spreadScore = 0;
  if (brentWti > 8) spreadScore = 15;
  else if (brentWti > 5) spreadScore = 10;
  else if (brentWti > 3) spreadScore = 5;
  components.push({
    name: "Brent-WTI Spread",
    score: spreadScore,
    maxScore: 15,
    status: spreadScore >= 10 ? "high" : spreadScore >= 5 ? "elevated" : "normal",
    detail: `$${brentWti.toFixed(2)}/bbl spread (Mid-East risk premium)`,
  });

  // 4. Tanker Shipping Index 7-day change (0-20)
  //    Tanker stocks rally when shipping rates spike (chokepoint disruption)
  //    < +3% = 0, 3-5% = 7, 5-10% = 14, > 10% = 20
  let tankerScore = 0;
  if (tanker7d > 10) tankerScore = 20;
  else if (tanker7d > 5) tankerScore = 14;
  else if (tanker7d > 3) tankerScore = 7;
  components.push({
    name: "Tanker Shipping Stress",
    score: tankerScore,
    maxScore: 20,
    status: tankerScore >= 14 ? "high" : tankerScore >= 7 ? "elevated" : "normal",
    detail: `${tanker7d >= 0 ? "+" : ""}${tanker7d.toFixed(1)}% tanker index over 7 days`,
  });

  // 5. Crack Spread Level (0-10)
  //    < $30 = 0, $30-40 = 3, $40-55 = 6, > $55 = 10
  let crackScore = 0;
  if (crack > 55) crackScore = 10;
  else if (crack > 40) crackScore = 6;
  else if (crack > 30) crackScore = 3;
  components.push({
    name: "Refining Margin Stress",
    score: crackScore,
    maxScore: 10,
    status: crackScore >= 6 ? "high" : crackScore >= 3 ? "elevated" : "normal",
    detail: `3:2:1 crack spread at $${crack.toFixed(2)}/bbl`,
  });

  // 6. Dollar Divergence (0-10)
  //    Oil rising while DXY also rising = unusual stress (oil should fall with strong dollar)
  //    If WTI up 7d AND DXY up 7d → score based on combined divergence
  let dxyScore = 0;
  if (wti7d > 2 && dxy7d > 0.5) {
    // Both rising = divergence, stress signal
    if (wti7d > 5 && dxy7d > 1) dxyScore = 10;
    else dxyScore = 5;
  }
  components.push({
    name: "Dollar Divergence",
    score: dxyScore,
    maxScore: 10,
    status: dxyScore >= 10 ? "high" : dxyScore >= 5 ? "elevated" : "normal",
    detail: dxyScore > 0
      ? `Oil +${wti7d.toFixed(1)}% while DXY ${dxy7d >= 0 ? "+" : ""}${dxy7d.toFixed(1)}% (divergence)`
      : `No divergence — DXY ${dxy7d >= 0 ? "+" : ""}${dxy7d.toFixed(1)}%, WTI ${wti7d >= 0 ? "+" : ""}${wti7d.toFixed(1)}%`,
  });

  // 7. SPR Trend 30-day (0-10)
  //    Rising = 0, flat = 3, declining -2% = 6, declining > -5% = 10
  let sprScore = 0;
  if (sprChange < -5) sprScore = 10;
  else if (sprChange < -2) sprScore = 6;
  else if (sprChange < 0) sprScore = 3;
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
