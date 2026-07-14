import { getLatestMetrics, getMetricHistory } from "@/lib/supabase";
import { MetricCard } from "@/components/metric-card";
import { PriceChart } from "@/components/price-chart";
import { ThreatBanner } from "@/components/threat-level";
import { SPRBarrel } from "@/components/spr-barrel";
import { computeThreatScore } from "@/lib/threat-score";
import { formatCurrency } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Strait Crisis Dashboard",
  description:
    "Real-time macro energy security monitor — oil, Brent, crack spread, DXY, SPR inventory.",
};

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

export default async function DashboardPage() {
  const metrics = await getLatestMetrics();
  const wtiHistory = await getMetricHistory("wti_crude", 30);
  const brentHistory = await getMetricHistory("brent_crude", 30);
  const crackHistory = await getMetricHistory("crack_spread_321", 30);
  const dxyHistory = await getMetricHistory("dollar_index", 30);
  const tankerHistory = await getMetricHistory("tanker_index", 30);
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

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-primary" strokeWidth="2">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
                <path d="M2 7l10 5 10-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Strait Crisis Dashboard
              </h1>
              <p className="font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
                Macro Energy Security Monitor
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <div className="hidden text-right sm:block">
                <p className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
                  Last Update
                </p>
                <p className="font-mono text-xs text-foreground">
                  {new Date(lastUpdate).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
              <span className="size-2 animate-pulse rounded-full bg-success" />
              <span className="font-mono text-xs text-muted-foreground">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* Threat Level Banner — front and center */}
        {wti && (
          <div className="mb-8">
            <ThreatBanner result={threatScore} wtiPrice={wtiPrice} lastUpdate={lastUpdate} />
          </div>
        )}

        {/* Summary Bar */}
        {(wti || brent || crack || dxy) && (
          <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
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

        {/* Charts */}
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <PriceChart data={brentHistory} label="Brent Crude" unit="$/bbl" />
          <PriceChart data={wtiHistory} label="WTI Crude" unit="$/bbl" />
          <PriceChart data={tankerHistory} label="Tanker Shipping Index" unit="index" />
          <PriceChart data={crackHistory} label="3:2:1 Crack Spread" unit="$/bbl" />
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sortedMetrics.map((metric) => (
            <MetricCard key={metric.metric_key} metric={metric} />
          ))}
        </div>

        {/* SPR Section — Barrel + Chart */}
        {spr && (
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <SPRBarrel current={spr.value} previous={spr.change} />
            <div className="lg:col-span-2">
              <PriceChart data={sprHistory} label="SPR Crude Inventory" unit="million bbl" height={240} />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-6">
          <div className="flex flex-col items-start justify-between gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
            <p>
              Data: Yahoo Finance (delayed 15min) · EIA · Updated daily via Hermes cron
            </p>
            <p className="font-mono">
              For research purposes. Not financial advice.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

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
