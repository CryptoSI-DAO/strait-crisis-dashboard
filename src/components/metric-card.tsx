import { cn, formatNumber, formatPercent } from "@/lib/utils";
import { Sparkline } from "./sparkline";
import type { MetricWithChange } from "@/lib/supabase";

export function MetricCard({
  metric,
  className,
}: {
  metric: MetricWithChange;
  className?: string;
}) {
  const isUp = (metric.change ?? 0) >= 0;
  const changeColor = isUp ? "text-success" : "text-danger";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition hover:border-primary/30",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[0.65rem] tracking-[0.12em] text-muted-foreground uppercase">
            {metric.category}
          </p>
          <h3 className="mt-2 text-sm font-semibold text-foreground">
            {metric.metric_label}
          </h3>
        </div>
        {metric.change !== null && (
          <span
            className={cn(
              "rounded-md px-2 py-0.5 font-mono text-xs font-medium",
              changeColor,
              isUp ? "bg-success/10" : "bg-danger/10",
            )}
          >
            {formatPercent(metric.change_pct ?? 0)}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-bold text-foreground">
          {formatNumber(metric.value, metric.unit === "bbl" || metric.unit === "$/bbl" ? 2 : metric.unit === "index" ? 2 : 0)}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {metric.unit}
        </span>
      </div>

      {metric.change !== null && (
        <div className={cn("mt-1 font-mono text-xs", changeColor)}>
          {isUp ? "↑" : "↓"} {formatNumber(Math.abs(metric.change), 2)} from last snapshot
        </div>
      )}

      {metric.sparkline.length > 1 && (
        <div className="mt-3">
          <Sparkline data={metric.sparkline} positive={isUp} />
        </div>
      )}

      <p className="mt-3 font-mono text-[0.6rem] tracking-wider text-muted-foreground/60 uppercase">
        {metric.source} · {new Date(metric.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </p>
    </div>
  );
}
