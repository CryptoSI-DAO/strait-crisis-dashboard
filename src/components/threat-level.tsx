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
      className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
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
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Circle */}
            <div
              className="flex size-20 items-center justify-center rounded-full border-2 sm:size-24"
              style={{
                borderColor: color,
                backgroundColor: `${color}15`,
                boxShadow: `inset 0 0 20px ${color}40, 0 0 15px ${color}40`,
              }}
            >
              <div className="text-center">
                <p className="font-mono text-2xl font-black sm:text-3xl" style={{ color }}>
                  {total}
                </p>
                <p className="font-mono text-[0.5rem] tracking-wider text-muted-foreground uppercase">
                  /100
                </p>
              </div>
            </div>

            <div>
              <p className="font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
                Strait Threat Level
              </p>
              <h2
                className="text-3xl font-black tracking-tight sm:text-4xl"
                style={{ color }}
              >
                {level}
              </h2>
              <p
                className="font-mono text-sm font-semibold tracking-wider uppercase"
                style={{ color, opacity: 0.8 }}
              >
                {label}
              </p>
            </div>
          </div>

          {/* Current oil price */}
          <div className="text-center sm:text-right">
            <p className="font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
              WTI Crude
            </p>
            <p className="font-mono text-3xl font-bold sm:text-4xl" style={{ color }}>
              ${wtiPrice.toFixed(2)}
            </p>
            <p className="font-mono text-xs text-muted-foreground">/bbl</p>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {components.map((c) => (
            <ScoreBar key={c.name} component={c} />
          ))}
        </div>

        {/* Summary + legend */}
        <div className="mt-5 border-t pt-4" style={{ borderColor: `${color}33` }}>
          <p className="text-sm leading-relaxed text-foreground/90">{summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
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
    <div className="rounded-lg border border-border bg-card/60 p-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
          {component.name}
        </p>
        <p className="font-mono text-xs font-bold" style={{ color }}>
          {scoreText}
        </p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-1.5 text-[0.65rem] text-muted-foreground">
        {component.detail}
      </p>
    </div>
  );
}