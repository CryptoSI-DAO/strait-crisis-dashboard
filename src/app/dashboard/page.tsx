import { getLatestMetrics, getMetricHistory, getThreatScoreHistory } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase-server";
import { MetricCard } from "@/components/metric-card";
import { PriceChart } from "@/components/price-chart";
import { ThreatBanner } from "@/components/threat-level";
import { SPRBarrel } from "@/components/spr-barrel";
import { LockedCard, PremiumLockedCard } from "@/components/locked-card";
import { computeThreatScore } from "@/lib/threat-score";
import { formatCurrency } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { BottomNav } from "@/components/bottom-nav";
import { getLivePrices, mergeLiveWithStored } from "@/lib/live-prices";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Strait Crisis Dashboard",
  description:
    "Real-time macro energy security monitor — oil, Brent, crack spread, DXY, SPR inventory, and strategic shipping chokepoints.",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const isAnonymous = !user;
  const isPremium = user?.tier === "premium" || user?.tier === "admin";
  const isAdmin = user?.tier === "admin";

  // Fetch stored metrics from Supabase (fallback)
  const storedMetrics = await getLatestMetrics();

  // Fetch live prices from Yahoo Finance (10s cache, falls back to Supabase)
  const livePrices = await getLivePrices();
  const metrics = mergeLiveWithStored(storedMetrics, livePrices);

  // History still comes from Supabase (historical data doesn't change intraday)
  const wtiHistory = await getMetricHistory("wti_crude", isPremium ? 90 : 30);
  const brentHistory = await getMetricHistory("brent_crude", isPremium ? 90 : 30);
  const crackHistory = await getMetricHistory("crack_spread_321", isPremium ? 90 : 30);
  const dxyHistory = await getMetricHistory("dollar_index", isPremium ? 90 : 30);
  const tankerHistory = await getMetricHistory("tanker_index", isPremium ? 90 : 30);
  const sprHistory = await getMetricHistory("spr_inventory", 90);

  const sortedMetrics = [...metrics].sort(
    (a, b) =>
      METRIC_ORDER.indexOf(a.metric_key) - METRIC_ORDER.indexOf(b.metric_key),
  );

  const lastUpdate = metrics[0]?.recorded_at;
  const wti = metrics.find((m) => m.metric_key === "wti_crude");
  const brent = metrics.find((m) => m.metric_key === "brent_crude");
  const crack = metrics.find((m) => m.metric_key === "crack_spread_321");
  const dxy = metrics.find((m) => m.metric_key === "dollar_index");
  const spr = metrics.find((m) => m.metric_key === "spr_inventory");

  const wtiPrice = wti?.value ?? 0;
  const threatScore = await computeThreatScore();
  const threatHistory = await getThreatScoreHistory(30);

  return (
    <main className="min-h-screen overflow-x-hidden">
      <DashboardHeader user={user} lastUpdate={lastUpdate} />

      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-8 sm:py-8">
        {/* Threat Level Banner — always free */}
        {wti && (
          <div className="mb-6 sm:mb-8">
            <ThreatBanner
              result={threatScore}
              wtiPrice={wtiPrice}
              lastUpdate={lastUpdate}
              history={threatHistory}
            />
          </div>
        )}

        {/* Summary Bar — always free */}
        {(wti || brent || crack || dxy) && (
          <div className="mb-6 grid grid-cols-2 gap-2 sm:mb-8 sm:gap-3 lg:grid-cols-4">
            {wti && (
              <SummaryStat label="WTI Crude" value={formatCurrency(wti.value)} change={wti.change_pct} />
            )}
            {brent && (
              <SummaryStat label="Brent" value={formatCurrency(brent.value)} change={brent.change_pct} />
            )}
            {crack && (
              <SummaryStat
                label="3:2:1 Crack"
                value={formatCurrency(crack.value)}
                change={crack.change_pct}
              />
            )}
            {dxy && (
              <SummaryStat label="DXY" value={dxy.value.toFixed(2)} change={dxy.change_pct} />
            )}
          </div>
        )}

        {/* Charts — anonymous sees 2, free sees all, premium sees 90-day */}
        {isAnonymous ? (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-2">
            <PriceChart data={brentHistory} label="Brent Crude" unit="$/bbl" />
            <PriceChart data={wtiHistory} label="WTI Crude" unit="$/bbl" />
            <LockedCard
              title="Tanker Shipping Index"
              message="Sign up free to see tanker stress levels and crack spreads."
              cta="Sign up free"
              href="/login"
            />
            <LockedCard
              title="3:2:1 Crack Spread"
              message="Sign up free to see refining margin stress."
              cta="Sign up free"
              href="/login"
            />
          </div>
        ) : (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-2">
            <PriceChart data={brentHistory} label="Brent Crude" unit="$/bbl" />
            <PriceChart data={wtiHistory} label="WTI Crude" unit="$/bbl" />
            <PriceChart data={tankerHistory} label="Tanker Shipping Index" unit="index" />
            <PriceChart data={crackHistory} label="3:2:1 Crack Spread" unit="$/bbl" />
          </div>
        )}

        {/* Metric Cards — free sees half, premium sees all */}
        {isAnonymous ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {sortedMetrics.slice(0, 4).map((metric) => (
              <MetricCard key={metric.metric_key} metric={metric} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {sortedMetrics.map((metric) => (
              <MetricCard key={metric.metric_key} metric={metric} />
            ))}
          </div>
        )}

        {/* SPR Section — Premium only */}
        {isPremium && spr ? (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-3">
            <SPRBarrel current={spr.value} previous={spr.change} />
            <div className="lg:col-span-2">
              <PriceChart data={sprHistory} label="SPR Crude Inventory" unit="million bbl" height={240} />
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-3">
            <PremiumLockedCard
              title="SPR Barrel Visualization"
              message="See the Strategic Petroleum Reserve fill level with 20-year historical lows. Upgrade to unlock."
            />
            <div className="lg:col-span-2">
              <PremiumLockedCard
                title="90-Day SPR History"
                message="Track the SPR drawdown trend over 90 days. Premium feature."
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-10 border-t border-border pt-5 sm:mt-12 sm:pt-6">
          <div className="flex flex-col items-start justify-between gap-3 text-[0.7rem] text-muted-foreground sm:flex-row sm:items-center sm:text-xs">
            <p>
              Data: Hyperliquid (24/7) · Yahoo Finance · EIA API · Daily cron
            </p>
            <p className="font-mono">
              Research only. Not financial advice.
            </p>
          </div>
        </footer>
      </div>
      <BottomNav />
    </main>
  );
}

const METRIC_ORDER = [
  "wti_crude",
  "brent_crude",
  "brent_wti_spread",
  "crack_spread_321",
  "rbob_gasoline",
  "heating_oil",
  "dollar_index",
  "spr_inventory",
];

function SummaryStat({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: number | null;
}) {
  const isUp = (change ?? 0) >= 0;
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <p className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-bold">{value}</p>
      {change !== null && (
        <p className={`font-mono text-xs ${isUp ? "text-success" : "text-danger"}`}>
          {isUp ? "↑" : "↓"} {Math.abs(change).toFixed(2)}%
        </p>
      )}
    </div>
  );
}
