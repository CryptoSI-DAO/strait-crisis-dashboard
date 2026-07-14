import { cn } from "@/lib/utils";

export type ThreatLevel = "GREEN" | "YELLOW" | "RED";

export interface ThreatConfig {
  level: ThreatLevel;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  description: string;
  oilRange: string;
  icon: string;
}

export function getThreatLevel(wtiPrice: number): ThreatConfig {
  if (wtiPrice >= 85) {
    return {
      level: "RED",
      label: "ELEVATED",
      color: "#f85149",
      bgColor: "rgba(248, 81, 73, 0.12)",
      borderColor: "rgba(248, 81, 73, 0.4)",
      glowColor: "rgba(248, 81, 73, 0.25)",
      description: "Oil above $85/bbl. Supply disruption risk is high. Energy costs are pressuring consumers and markets. Watch for geopolitical escalation and SPR drawdowns.",
      oilRange: "$85+ USD/bbl",
      icon: "▲",
    };
  } else if (wtiPrice >= 70) {
    return {
      level: "YELLOW",
      label: "GUARDED",
      color: "#f0b429",
      bgColor: "rgba(240, 180, 41, 0.12)",
      borderColor: "rgba(240, 180, 41, 0.4)",
      glowColor: "rgba(240, 180, 41, 0.25)",
      description: "Oil in the $70–$85/bbl range. Elevated but manageable. Monitor shipping chokepoints, refinery utilization, and dollar strength for directional signals.",
      oilRange: "$70–$85 USD/bbl",
      icon: "◆",
    };
  } else {
    return {
      level: "GREEN",
      label: "LOW",
      color: "#3fb950",
      bgColor: "rgba(63, 185, 80, 0.12)",
      borderColor: "rgba(63, 185, 80, 0.4)",
      glowColor: "rgba(63, 185, 80, 0.25)",
      description: "Oil below $70/bbl. Supply is flowing normally. Energy costs are not a near-term risk to markets or consumers. Conditions are stable.",
      oilRange: "Sub $70 USD/bbl",
      icon: "▼",
    };
  }
}

export function ThreatBanner({
  threat,
  wtiPrice,
  lastUpdate,
}: {
  threat: ThreatConfig;
  wtiPrice: number;
  lastUpdate?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-6 sm:p-8"
      style={{
        backgroundColor: threat.bgColor,
        borderColor: threat.borderColor,
        boxShadow: `0 0 40px ${threat.glowColor}`,
      }}
    >
      {/* Glow effect */}
      <div
        className="pointer-events-none absolute -top-1/2 left-1/2 h-full w-[120%] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: threat.color }}
      />

      <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Level indicator */}
        <div className="flex items-center gap-5">
          {/* Big circle indicator */}
          <div
            className="flex size-20 items-center justify-center rounded-full border-2 sm:size-24"
            style={{
              borderColor: threat.color,
              backgroundColor: `${threat.color}15`,
              boxShadow: `inset 0 0 20px ${threat.glowColor}, 0 0 15px ${threat.glowColor}`,
            }}
          >
            <span
              className="text-3xl font-black sm:text-4xl"
              style={{ color: threat.color }}
            >
              {threat.icon}
            </span>
          </div>

          <div>
            <p className="font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
              Strait Threat Level
            </p>
            <h2
              className="text-3xl font-black tracking-tight sm:text-4xl"
              style={{ color: threat.color }}
            >
              {threat.level}
            </h2>
            <p
              className="font-mono text-sm font-semibold tracking-wider uppercase"
              style={{ color: threat.color, opacity: 0.8 }}
            >
              {threat.label}
            </p>
          </div>
        </div>

        {/* Right: Current oil price */}
        <div className="text-center sm:text-right">
          <p className="font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
            WTI Crude
          </p>
          <p
            className="font-mono text-3xl font-bold sm:text-4xl"
            style={{ color: threat.color }}
          >
            ${wtiPrice.toFixed(2)}
          </p>
          <p className="font-mono text-xs text-muted-foreground">/bbl</p>
        </div>
      </div>

      {/* Description */}
      <div className="relative mt-5 border-t pt-4" style={{ borderColor: threat.borderColor }}>
        <p className="text-sm leading-relaxed text-foreground/90">
          {threat.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
          <span>
            <span className="inline-block size-2 rounded-full mr-1.5" style={{ backgroundColor: "#3fb950" }} />
            Green: Sub $70
          </span>
          <span>
            <span className="inline-block size-2 rounded-full mr-1.5" style={{ backgroundColor: "#f0b429" }} />
            Yellow: $70–$85
          </span>
          <span>
            <span className="inline-block size-2 rounded-full mr-1.5" style={{ backgroundColor: "#f85149" }} />
            Red: $85+
          </span>
          {lastUpdate && (
            <span className="ml-auto">
              Updated {new Date(lastUpdate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
