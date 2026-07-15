import { cn } from "@/lib/utils";
import type { ThreatScoreResult, ThreatScoreComponent } from "@/lib/threat-score";

export function ThreatBanner({
  result,
  wtiPrice,
  lastUpdate,
}: {
  result: ThreatScoreResult;
  wtiPrice: number;
  lastUpdate?: string;
}) {
  const { level, label, color, total, components, summary } = result;
  const scorePct = Math.min(Math.max(total, 0), 100);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4 sm:p-8"
      style={{
        backgroundColor: `${color}10`,
        borderColor: `${color}55`,
      }}
    >
      <div className="relative">
        {/* Top row: score number + level + WTI */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.55rem] tracking-[0.15em] text-muted-foreground uppercase sm:text-[0.65rem] sm:tracking-[0.2em]">
              Threat Level
            </p>
            <div className="mt-1 flex items-baseline gap-3">
              <h2 className="text-2xl font-black tracking-tight sm:text-4xl" style={{ color }}>
                {level}
              </h2>
              <span className="font-mono text-sm font-semibold sm:text-lg" style={{ color, opacity: 0.7 }}>
                {label}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="font-mono text-[0.55rem] tracking-[0.15em] text-muted-foreground uppercase sm:text-[0.65rem]">
              WTI
            </p>
            <p className="font-mono text-xl font-bold sm:text-3xl" style={{ color }}>
              ${wtiPrice.toFixed(2)}
            </p>
            <p className="font-mono text-[0.5rem] text-muted-foreground sm:text-xs">/bbl</p>
          </div>
        </div>

        {/* Horizontal gauge */}
        <div className="mt-5 sm:mt-7">
          {/* Score label above needle */}
          <div className="relative mb-2 h-6">
            <div
              className="absolute flex -translate-x-1/2 flex-col items-center transition-all duration-500"
              style={{ left: `${scorePct}%` }}
            >
              <span className="font-mono text-lg font-black sm:text-2xl" style={{ color }}>
                {total}
              </span>
              <span className="font-mono text-[0.45rem] text-muted-foreground uppercase">/100</span>
            </div>
          </div>

          {/* The gauge bar */}
          <div className="relative">
            {/* Color zones */}
            <div className="flex h-6 overflow-hidden rounded-full border border-border sm:h-8">
              {/* Green zone 0-35 */}
              <div
                className="h-full"
                style={{ width: "35%", background: "linear-gradient(90deg, #3fb950, #4cc95a)" }}
              >
                <span className="flex h-full items-center justify-center font-mono text-[0.5rem] font-bold text-black/60 sm:text-[0.6rem]">
                  SAFE
                </span>
              </div>
              {/* Orange zone 36-65 */}
              <div
                className="h-full"
                style={{ width: "30%", background: "linear-gradient(90deg, #f0b429, #e8a520)" }}
              >
                <span className="flex h-full items-center justify-center font-mono text-[0.5rem] font-bold text-black/60 sm:text-[0.6rem]">
                  GUARDED
                </span>
              </div>
              {/* Red zone 66-100 */}
              <div
                className="h-full"
                style={{ width: "35%", background: "linear-gradient(90deg, #f85149, #e8423f)" }}
              >
                <span className="flex h-full items-center justify-center font-mono text-[0.5rem] font-bold text-white/70 sm:text-[0.6rem]">
                  CRITICAL
                </span>
              </div>
            </div>

            {/* Needle marker */}
            <div
              className="absolute -top-1.5 -translate-x-1/2 transition-all duration-500"
              style={{ left: `${scorePct}%` }}
            >
              <div className="flex flex-col items-center">
                <div
                  className="h-0 w-0"
                  style={{
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: `8px solid ${color}`,
                  }}
                />
                <div className="h-9 w-0.5 sm:h-11" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
              </div>
            </div>

            {/* Tick marks */}
            <div className="mt-1 flex justify-between font-mono text-[0.45rem] text-muted-foreground sm:text-[0.55rem]">
              <span>0</span>
              <span className="absolute left-[35%] -translate-x-1/2">35</span>
              <span className="absolute left-[65%] -translate-x-1/2">65</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-2 lg:grid-cols-4">
          {components.map((c) => (
            <ScoreBar key={c.name} component={c} />
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 border-t pt-3 sm:mt-5 sm:pt-4" style={{ borderColor: `${color}30` }}>
          <p className="text-xs leading-relaxed text-foreground/90 sm:text-sm">{summary}</p>
          {lastUpdate && (
            <p className="mt-2 font-mono text-[0.5rem] tracking-wider text-muted-foreground uppercase sm:text-[0.55rem]">
              Updated {new Date(lastUpdate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ component }: { component: ThreatScoreComponent }) {
  const pct = (component.score / component.maxScore) * 100;
  const color =
    component.status === "high" ? "#f85149"
    : component.status === "elevated" ? "#f0b429"
    : "#3fb950";
  const scoreText = `${component.score}/${component.maxScore}`;

  return (
    <div className="rounded-lg border border-border bg-card/60 p-2 sm:p-3">
      <div className="flex items-center justify-between gap-1">
        <p className="truncate font-mono text-[0.5rem] tracking-wider text-muted-foreground uppercase sm:text-[0.6rem]">
          {component.name}
        </p>
        <p className="shrink-0 font-mono text-[0.65rem] font-bold sm:text-xs" style={{ color }}>
          {scoreText}
        </p>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted sm:mt-2">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-1 truncate text-[0.55rem] text-muted-foreground sm:mt-1.5 sm:text-[0.65rem]">
        {component.detail}
      </p>
    </div>
  );
}
