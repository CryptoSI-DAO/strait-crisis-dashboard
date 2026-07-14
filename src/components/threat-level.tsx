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

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-4 sm:p-8"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}66`,
        boxShadow: `0 0 40px ${color}40`,
      }}
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute -top-1/2 left-1/2 h-full w-[120%] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: color }}
      />

      <div className="relative">
        {/* Top row: indicator + score */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Circle */}
            <div
              className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 sm:size-24"
              style={{
                borderColor: color,
                backgroundColor: `${color}15`,
                boxShadow: `inset 0 0 20px ${color}40, 0 0 15px ${color}40`,
              }}
            >
              <div className="text-center">
                <p className="font-mono text-xl font-black sm:text-3xl" style={{ color }}>
                  {total}
                </p>
                <p className="font-mono text-[0.45rem] tracking-wider text-muted-foreground uppercase sm:text-[0.5rem]">
                  /100
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <p className="font-mono text-[0.55rem] tracking-[0.15em] text-muted-foreground uppercase sm:text-[0.65rem] sm:tracking-[0.2em]">
                Threat Level
              </p>
              <h2
                className="text-2xl font-black tracking-tight sm:text-4xl"
                style={{ color }}
              >
                {level}
              </h2>
              <p
                className="font-mono text-xs font-semibold tracking-wider uppercase sm:text-sm"
                style={{ color, opacity: 0.8 }}
              >
                {label}
              </p>
            </div>
          </div>

          {/* Current oil price */}
          <div className="shrink-0 text-right">
            <p className="font-mono text-[0.55rem] tracking-[0.15em] text-muted-foreground uppercase sm:text-[0.65rem] sm:tracking-[0.2em]">
              WTI
            </p>
            <p className="font-mono text-2xl font-bold sm:text-4xl" style={{ color }}>
              ${wtiPrice.toFixed(2)}
            </p>
            <p className="font-mono text-[0.55rem] text-muted-foreground sm:text-xs">/bbl</p>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-2 lg:grid-cols-4">
          {components.map((c) => (
            <ScoreBar key={c.name} component={c} />
          ))}
        </div>

        {/* Summary + legend */}
        <div className="mt-4 border-t pt-3 sm:mt-5 sm:pt-4" style={{ borderColor: `${color}33` }}>
          <p className="text-xs leading-relaxed text-foreground/90 sm:text-sm">{summary}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.55rem] tracking-wider text-muted-foreground uppercase sm:mt-3 sm:gap-x-4 sm:text-[0.65rem]">
            <span>
              <span className="mr-1.5 inline-block size-2 rounded-full" style={{ backgroundColor: "#3fb950" }} />
              Green: 0–35
            </span>
            <span>
              <span className="mr-1.5 inline-block size-2 rounded-full" style={{ backgroundColor: "#f0b429" }} />
              Yellow: 36–65
            </span>
            <span>
              <span className="mr-1.5 inline-block size-2 rounded-full" style={{ backgroundColor: "#f85149" }} />
              Red: 66–100
            </span>
            {lastUpdate && (
              <span className="ml-auto">
                Updated {new Date(lastUpdate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
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