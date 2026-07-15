/**
 * Live price fetcher with 10-second in-memory cache.
 * Fetches from Yahoo Finance HTTP API (no Python needed).
 * Falls back to Supabase stored data if Yahoo fails.
 */

interface LivePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface CachedPrices {
  data: Record<string, LivePrice>;
  timestamp: number;
}

// 10-second cache
const CACHE_TTL = 10_000;

// The tickers we need
const TICKERS = [
  { symbol: "CL=F", key: "wti_crude" },
  { symbol: "BZ=F", key: "brent_crude" },
  { symbol: "RB=F", key: "rbob_gasoline" },
  { symbol: "HO=F", key: "heating_oil" },
  { symbol: "DX-Y.NYB", key: "dollar_index" },
  { symbol: "FRO", key: "tanker_fro" },
  { symbol: "NAT", key: "tanker_nat" },
  { symbol: "STNG", key: "tanker_stng" },
  { symbol: "TNK", key: "tanker_tnk" },
  { symbol: "INSW", key: "tanker_insw" },
];

let cache: CachedPrices | null = null;
let fetchPromise: Promise<Record<string, LivePrice> | null> | null = null;

async function fetchFromYahoo(): Promise<Record<string, LivePrice>> {
  const results: Record<string, LivePrice> = {};

  // Yahoo Finance v8 chart API — single batch call for all symbols
  // We fetch individually since Yahoo's batch endpoint is unreliable
  const promises = TICKERS.map(async ({ symbol, key }) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
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
        },
      };
    } catch {
      return null;
    }
  });

  const settled = await Promise.all(promises);

  for (const result of settled) {
    if (result) {
      results[result.key] = result.data;
    }
  }

  return results;
}

/**
 * Get live prices with 10-second caching.
 * If Yahoo is unreachable, returns null (caller falls back to Supabase).
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

  fetchPromise = fetchFromYahoo()
    .then((data) => {
      // Only cache if we got at least the core prices
      if (data.wti_crude && data.brent_crude) {
        cache = { data, timestamp: Date.now() };
      }
      return data;
    })
    .catch(() => {
      return cache?.data ?? null;
    })
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
 */
export function mergeLiveWithStored<T extends { metric_key: string; value: number; recorded_at: string }>(
  stored: T[],
  live: Record<string, LivePrice> | null,
): T[] {
  if (!live) return stored;

  // Live prices map: metric_key -> { value, change_pct }
  const liveMap: Record<string, { value: number; change_pct: number }> = {};

  // Map Yahoo tickers to our metric keys
  const tickerToMetric: Record<string, string> = {
    wti_crude: "wti_crude",
    brent_crude: "brent_crude",
    rbob_gasoline: "rbob_gasoline",
    heating_oil: "heating_oil",
    dollar_index: "dollar_index",
  };

  for (const [key, data] of Object.entries(live)) {
    const metricKey = tickerToMetric[key];
    if (metricKey) {
      liveMap[metricKey] = { value: data.price, change_pct: data.changePercent };
    }
  }

  // Also handle tanker stocks (they feed into tanker_index but aren't displayed individually)
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
