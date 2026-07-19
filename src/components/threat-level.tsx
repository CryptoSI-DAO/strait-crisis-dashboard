import { cn } from "@/lib/utils";
import type { ThreatScoreResult, ThreatScoreComponent } from "@/lib/threat-score";

interface ThreatHistoryPoint {
  recorded_at: string;
  total: number;
  level: "GREEN" | "YELLOW" | "RED";
}

export function ThreatBanner({
  result,
  wtiPrice,
  lastUpdate,
  history = [],
}: {
  result: ThreatScoreResult;
  wtiPrice: number;
  lastUpdate?: string;
  history?: ThreatHistoryPoint[];
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

        {/* 30-day trend sparkline */}
        {history.length > 1 && (
          <ThreatTrend history={history} currentScore={total} currentColor={color} />
        )}

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

/**
 * 30-day threat score trend sparkline with green/yellow/red zone bands.
 */
function ThreatTrend({
  history,
  currentScore,
  currentColor,
}: {
  history: ThreatHistoryPoint[];
  currentScore: number;
  currentColor: string;
}) {
  const W = 100;
  const H = 32;

  const scores = history.map((h) => h.total);
  const min = Math.min(...scores, 20);
  const max = Math.max(...scores, 70);
  const range = Math.max(max - min, 10);

  const points = history.map((h, i) => {
    const x = history.length === 1 ? W : (i / (history.length - 1)) * W;
    const y = H - ((h.total - min) / range) * (H - 4) - 2;
    return [x, y] as const;
  });

  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  // Area fill path (close to baseline)
  const areaPath = `${path} L${W},${H} L0,${H} Z`;

  const first = scores[0] ?? 0;
  const delta = currentScore - first;
  const oldestDate = new Date(history[0].recorded_at);
  const newestDate = new Date(history[history.length - 1].recorded_at);
  const spanDays = Math.max(
    1,
    Math.round((newestDate.getTime() - oldestDate.getTime()) / 86400000),
  );

  return (
    <div className="mt-5 sm:mt-7">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.55rem] tracking-[0.15em] text-muted-foreground uppercase sm:text-[0.65rem]">
          {spanDays}-Day Trend
        </p>
        <p
          className="font-mono text-[0.55rem] font-bold sm:text-[0.65rem]"
          style={{ color: delta > 0 ? "#f85149" : delta < 0 ? "#3fb950" : currentColor }}
        >
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "→"} {delta > 0 ? "+" : ""}
          {delta} pts
        </p>
      </div>
      <div className="relative mt-2 h-9 w-full overflow-hidden rounded-md border border-border/60 sm:h-12">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {/* Zone bands: green 0-35, yellow 35-65, red 65-100 (mapped to score range) */}
          <rect
            x="0"
            y={H - ((35 - min) / range) * (H - 4) - 2}
            width={W}
            height={Math.max(0, ((65 - 35) / range) * (H - 4))}
            fill="#f0b429"
            opacity={0.06}
          />
          {/* Trend area */}
          <path d={areaPath} fill={currentColor} opacity={0.08} />
          {/* Trend line */}
          <path
            d={path}
            fill="none"
            stroke={currentColor}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.85}
          />
          {/* Current point */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1][0]}
              cy={points[points.length - 1][1]}
              r={1.2}
              fill={currentColor}
            />
          )}
        </svg>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[0.45rem] text-muted-foreground sm:text-[0.55rem]">
        <span>{oldestDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        <span>avg {Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}/100</span>
        <span>now</span>
      </div>
    </div>
  );
}
