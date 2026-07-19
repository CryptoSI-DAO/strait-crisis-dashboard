/**
 * Live price fetcher with 10-second in-memory cache.
 *
 * Primary source: Hyperliquid HIP-3 (Trade.xyz builder dex) for WTI & Brent crude.
 *   - These markets trade 24/7 and capture true after-hours pricing.
 *   - Yahoo Finance's CL=F / BZ=F have NO pre/post-market data and freeze ~23h
 *     at the CME session close, missing overnight moves.
 *
 * Secondary source: Yahoo Finance for refined products, DXY, tanker stocks.
 *   - These only need daily-granularity pricing, so Yahoo is fine.
 *
 * Falls back to Supabase stored data if both live sources fail.
 */

interface LivePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  source: "hyperliquid" | "yahoo";
}

interface CachedPrices {
  data: Record<string, LivePrice>;
  timestamp: number;
}

// 10-second cache
const CACHE_TTL = 10_000;

// Yahoo tickers (refined products, DXY, tankers — daily granularity OK)
const YAHOO_TICKERS = [
  { symbol: "RB=F", key: "rbob_gasoline" },
  { symbol: "HO=F", key: "heating_oil" },
  { symbol: "DX-Y.NYB", key: "dollar_index" },
  { symbol: "FRO", key: "tanker_fro" },
  { symbol: "NAT", key: "tanker_nat" },
  { symbol: "STNG", key: "tanker_stng" },
  { symbol: "TNK", key: "tanker_tnk" },
  { symbol: "INSW", key: "tanker_insw" },
];

// Hyperliquid HIP-3 markets (Trade.xyz builder dex, index 1 mainnet)
// These trade 24/7 — true after-hours pricing
const HL_API = "https://api.hyperliquid.xyz/info";
const HL_DEX = "xyz";
const HL_TICKERS: Record<string, string> = {
  "xyz:CL": "wti_crude", // WTI Crude Oil (display: WTIOIL)
  "xyz:BRENTOIL": "brent_crude", // Brent Crude Oil
};

let cache: CachedPrices | null = null;
let fetchPromise: Promise<Record<string, LivePrice> | null> | null = null;

/**
 * Fetch WTI & Brent from Hyperliquid HIP-3 (24/7 markets).
 * Returns null on failure so caller can fall back to Yahoo.
 */
async function fetchFromHyperliquid(): Promise<Partial<Record<string, LivePrice>>> {
  try {
    const res = await fetch(HL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs", dex: HL_DEX }),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.error("[live-prices] Hyperliquid HTTP", res.status);
      return {};
    }

    const json = await res.json();
    // Response shape: [meta, ctxs] where meta.universe[].name and ctxs[] align by index
    const meta = json?.[0];
    const ctxs = json?.[1];
    if (!Array.isArray(meta?.universe) || !Array.isArray(ctxs)) {
      console.error("[live-prices] Hyperliquid malformed response");
      return {};
    }

    const results: Partial<Record<string, LivePrice>> = {};

    for (let i = 0; i < meta.universe.length; i++) {
      const market = meta.universe[i];
      const ctx = ctxs[i];
      const hlName = market?.name;
      const key = HL_TICKERS[hlName];
      if (!key || !ctx) continue;

      const markPx = parseFloat(ctx.markPx);
      const prevDayPx = parseFloat(ctx.prevDayPx ?? ctx.oraclePx ?? markPx);

      if (!Number.isFinite(markPx) || markPx <= 0) {
        console.error(`[live-prices] Hyperliquid bad price for ${hlName}:`, ctx.markPx);
        continue;
      }

      const change = markPx - prevDayPx;
      const changePercent = prevDayPx > 0 ? (change / prevDayPx) * 100 : 0;

      results[key] = {
        symbol: hlName,
        price: markPx,
        change,
        changePercent,
        source: "hyperliquid",
      };
    }

    return results;
  } catch (err) {
    console.error("[live-prices] Hyperliquid fetch failed:", err);
    return {};
  }
}

/**
 * Fetch refined products, DXY, and tanker stocks from Yahoo Finance.
 * Only used for non-oil metrics now.
 */
async function fetchFromYahoo(): Promise<Partial<Record<string, LivePrice>>> {
  const results: Partial<Record<string, LivePrice>> = {};

  const settled = await Promise.all(
    YAHOO_TICKERS.map(async ({ symbol, key }) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
          symbol,
        )}?interval=1d&range=2d`;
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          },
          next: { revalidate: 0 },
        });

        if (!res.ok) return null;

        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        if (!meta) return null;

        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;

        return {
          key,
          data: {
            symbol,
            price,
            change: price - prevClose,
            changePercent: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
            source: "yahoo" as const,
          },
        };
      } catch {
        return null;
      }
    }),
  );

  for (const result of settled) {
    if (result) {
      results[result.key] = result.data;
    }
  }

  return results;
}

/**
 * Get live prices with 10-second caching.
 * Merges Hyperliquid (oil) + Yahoo (refined/DXY/tankers).
 * If both fail, returns null (caller falls back to Supabase).
 */
export async function getLivePrices(): Promise<Record<string, LivePrice> | null> {
  const now = Date.now();

  // Return cache if fresh
  if (cache && now - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  // Deduplicate: if a fetch is already in flight, wait for it
  if (fetchPromise) {
    try {
      return await fetchPromise;
    } catch {
      return cache?.data ?? null;
    }
  }

  fetchPromise = (async () => {
    const [hlPrices, yahooPrices] = await Promise.all([
      fetchFromHyperliquid(),
      fetchFromYahoo(),
    ]);

    const merged: Record<string, LivePrice> = {
      ...yahooPrices,
      ...hlPrices, // HL wins on conflict (oil)
    } as Record<string, LivePrice>;

    // Only cache if we got at least the core prices
    if (merged.wti_crude && merged.brent_crude) {
      cache = { data: merged, timestamp: Date.now() };
    }

    return merged;
  })()
    .catch(() => cache?.data ?? null)
    .finally(() => {
      fetchPromise = null;
    });

  try {
    return await fetchPromise;
  } catch {
    return cache?.data ?? null;
  }
}

/**
 * Merge live prices into Supabase metrics.
 * Live data takes priority for value + change_pct; Supabase fills the rest.
 *
 * Notes:
 *   - WTI & Brent come from Hyperliquid (24/7, source="hyperliquid")
 *   - Refined products, DXY come from Yahoo (source="yahoo")
 *   - Tanker stocks feed into tanker_index but aren't displayed individually
 */
export function mergeLiveWithStored<
  T extends { metric_key: string; value: number; recorded_at: string },
>(stored: T[], live: Record<string, LivePrice> | null): T[] {
  if (!live) return stored;

  const liveMap: Record<string, { value: number; change_pct: number }> = {};

  for (const [key, data] of Object.entries(live)) {
    // Only map the metrics we actually display (skip individual tanker_* keys)
    if (
      key === "wti_crude" ||
      key === "brent_crude" ||
      key === "rbob_gasoline" ||
      key === "heating_oil" ||
      key === "dollar_index"
    ) {
      liveMap[key] = { value: data.price, change_pct: data.changePercent };
    }
  }

  const merged = stored.map((m): T => {
    const liveData = liveMap[m.metric_key];
    if (liveData) {
      return {
        ...m,
        value: liveData.value,
        change_pct: liveData.change_pct,
        recorded_at: new Date().toISOString(),
      };
    }
    return m;
  });

  return merged;
}

export type { LivePrice };
