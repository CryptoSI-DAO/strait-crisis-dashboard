"use client";

import { useState } from "react";

// Native date formatting - no external dependency
function formatDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * SPR (Strategic Petroleum Reserve) Countdown Widget
 *
 * Visualizes the absolute SPR level against critical thresholds and estimates
 * how many weeks until each floor is reached, based on the actual drawdown rate.
 *
 * Thresholds (publicly reported):
 *  - Congressional minimum: 243M barrels
 *  - Operational minimum (official): 150M barrels
 *  - Operational minimum (revised, 2026): 70M barrels
 */

const THRESHOLDS = [
  {
    label: "Congressional Minimum",
    value: 243,
    severity: "caution",
    explanation:
      "The legally mandated floor set by Congress. Below this, Congress can block further releases and mandate refills — making the government a buyer instead of a seller. This is effectively the end of the 'price suppression' lever.",
  },
  {
    label: "Operational Minimum",
    value: 150,
    severity: "critical",
    explanation:
      "The level where the salt dome storage sites begin to malfunction. Pressure drops cause cavern instability. Drawing below this risks permanent damage to the physical infrastructure that stores the reserve.",
  },
  {
    label: "Revised Minimum (2026)",
    value: 70,
    severity: "extreme",
    explanation:
      "A revised operational floor reported in 2026 — roughly half the original 150M minimum. Reaching this level would represent an unprecedented depletion with no historical precedent and severe national security implications.",
  },
] as const;

const PEAK_SP = 727; // Historical peak (2010)

const SEVERITY_STYLES = {
  caution: { color: "#f0b429", label: "CAUTION", glow: "rgba(240,180,41,0.15)" },
  critical: { color: "#f85149", label: "CRITICAL", glow: "rgba(248,81,73,0.15)" },
  extreme: { color: "#a371f7", label: "EXTREME", glow: "rgba(163,113,247,0.15)" },
} as const;

export function SPRCountdown({
  currentSPR,
  drawdownRate,
}: {
  /** Current SPR in millions of barrels */
  currentSPR: number;
  /** Drawdown rate in millions of barrels per week */
  drawdownRate: number;
}) {
  const weeklyRate = drawdownRate > 0 ? drawdownRate : 6.7; // fallback to 14-week avg
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Calculate weeks and dates to each threshold
  const projections = THRESHOLDS.map((t) => {
    const barrelsRemaining = currentSPR - t.value;
    const weeksRemaining =
      barrelsRemaining > 0 ? Math.ceil(barrelsRemaining / weeklyRate) : 0;
    const date = new Date();
    date.setDate(date.getDate() + weeksRemaining * 7);

    return {
      ...t,
      weeksRemaining,
      date,
      barrelsRemaining,
      reached: barrelsRemaining <= 0,
    };
   });

  // The visualization: a vertical bar showing 0-727M with threshold lines
  const barHeight = 280; // px
  const currentYPct = ((PEAK_SP - currentSPR) / PEAK_SP) * 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-mono text-[0.65rem] tracking-[0.15em] text-muted-foreground uppercase">
            SPR Strategic Reserve
          </h3>
          <p className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {currentSPR.toFixed(1)}M
            <span className="ml-1 text-sm font-normal text-muted-foreground">bbl</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[0.55rem] tracking-wider text-muted-foreground uppercase">
            Draw Rate
          </p>
          <p className="font-mono text-sm font-bold text-[#f85149]">
            -{weeklyRate.toFixed(1)}M<span className="text-xs font-normal text-muted-foreground">/wk</span>
          </p>
        </div>
      </div>

      {/* Visual bar with thresholds */}
      <div className="mt-5 flex gap-4">
        {/* The bar */}
        <div className="relative" style={{ height: barHeight, width: "32px" }}>
          {/* Track */}
          <div className="absolute inset-0 rounded-full bg-muted/50" />

          {/* Filled portion (current level from 0 to current) */}
          <div
            className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-[#f85149]/80 via-[#f0b429]/60 to-[#f0b429]/40"
            style={{
              height: `${((currentSPR / PEAK_SP) * 100).toFixed(1)}%`,
            }}
          />

          {/* Threshold lines */}
          {THRESHOLDS.map((t) => {
            const bottomPct = (t.value / PEAK_SP) * 100;
            const style = SEVERITY_STYLES[t.severity];
            return (
              <div
                key={t.label}
                className="absolute left-0 w-full border-t-2 border-dashed"
                style={{
                  bottom: `${bottomPct}%`,
                  borderColor: style.color,
                }}
              >
                <span
                  className="absolute -right-1 top-1.5 whitespace-nowrap rounded px-1 py-0.5 font-mono text-[0.5rem] font-bold"
                  style={{
                    color: style.color,
                    backgroundColor: style.glow,
                  }}
                >
                  {t.value}M
                </span>
              </div>
            );
          })}

          {/* Current level marker */}
          <div
            className="absolute left-0 z-10 w-full"
            style={{ bottom: `calc(${((currentSPR / PEAK_SP) * 100).toFixed(1)}% - 1px)` }}
          >
            <div className="h-0.5 w-full bg-foreground" />
          </div>
        </div>

        {/* Labels and countdowns */}
        <div className="flex flex-1 flex-col justify-between py-1">
          {projections
            .slice()
            .reverse()
            .map((p) => {
              const style = SEVERITY_STYLES[p.severity];
              return (
                <div key={p.label} className="relative flex items-center justify-between gap-2">
                  <div className="flex items-start gap-1.5">
                    <div>
                      <div className="flex items-center gap-1">
                        <p
                          className="font-mono text-[0.6rem] font-bold tracking-wider uppercase"
                          style={{ color: style.color }}
                        >
                          {p.label}
                        </p>
                        {/* Info icon — hover/tap to see explanation */}
                        <button
                          type="button"
                          aria-label={`What is ${p.label}?`}
                          className="inline-flex size-3.5 items-center justify-center rounded-full border border-muted-foreground/40 text-muted-foreground transition hover:border-foreground hover:text-foreground"
                          onMouseEnter={() => setActiveTooltip(p.label)}
                          onMouseLeave={() => setActiveTooltip(null)}
                          onClick={() =>
                            setActiveTooltip(activeTooltip === p.label ? null : p.label)
                          }
                        >
                          <span className="font-mono text-[0.5rem] font-bold">i</span>
                        </button>
                      </div>
                      <p className="font-mono text-[0.5rem] text-muted-foreground">
                        {p.value}M barrels
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {p.reached ? (
                      <p className="font-mono text-sm font-bold text-[#f85149]">
                        PASSED
                      </p>
                    ) : (
                      <>
                        <p className="font-mono text-sm font-bold" style={{ color: style.color }}>
                          {p.weeksRemaining}w
                        </p>
                        <p className="font-mono text-[0.5rem] text-muted-foreground">
                          {formatDate(p.date)}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Tooltip */}
                  {activeTooltip === p.label && (
                    <div className="absolute bottom-full left-0 z-20 mb-2 w-64 rounded-lg border border-border bg-popover p-3 shadow-xl">
                      <p
                        className="font-mono text-[0.55rem] font-bold tracking-wider uppercase mb-1"
                        style={{ color: style.color }}
                      >
                        {p.label} — {p.value}M bbl
                      </p>
                      <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
                        {p.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Peak reference */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-[0.55rem] text-muted-foreground">
          Peak: {PEAK_SP}M bbl (2010)
        </span>
        <span className="font-mono text-[0.55rem] text-muted-foreground">
          -{(((PEAK_SP - currentSPR) / PEAK_SP) * 100).toFixed(1)}% from peak
        </span>
      </div>
    </div>
  );
}
