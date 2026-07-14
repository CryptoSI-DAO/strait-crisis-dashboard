import { formatNumber } from "@/lib/utils";

// SPR max capacity: ~727 million barrels (historical high, July 2010)
const SPR_MAX_CAPACITY = 727;

// Historical low markers (from EIA API data)
const SPR_LOWS = [
  { date: "Jul 2023", value: 346.8, label: "2023 Low" },
  { date: "Dec 2022", value: 372.4, label: "2022 Low" },
];

export function SPRBarrel({
  current,
  previous,
}: {
  current: number;
  previous?: number | null;
}) {
  const fillPct = Math.min((current / SPR_MAX_CAPACITY) * 100, 100);
  const change = previous ? current - previous : null;
  const isDeclining = change !== null && change < 0;

  const status = current > 500 ? "HEALTHY" : current > 350 ? "MODERATE" : "LOW";
  const statusColor =
    current > 500 ? "#3fb950" : current > 350 ? "#f0b429" : "#f85149";

  // Y position on the barrel SVG for a given value
  const yForValue = (val: number) => 115 - (val / SPR_MAX_CAPACITY) * 110;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase sm:text-[0.65rem]">
            Strategic Petroleum Reserve
          </p>
          <h3 className="mt-1 text-sm font-semibold text-foreground">
            Crude Oil Inventory
          </h3>
        </div>
        <div
          className="rounded-md px-2 py-0.5 font-mono text-[0.55rem] font-bold tracking-wider uppercase sm:text-[0.6rem]"
          style={{
            color: statusColor,
            backgroundColor: `${statusColor}15`,
          }}
        >
          {status}
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-5 sm:mt-6 sm:flex-row sm:items-start sm:gap-6">
        {/* Barrel SVG with markers */}
        <div className="relative shrink-0">
          <svg width="100" height="140" viewBox="0 0 100 140">
            <defs>
              <clipPath id="barrel-clip">
                <path d="M 15 10 Q 15 5, 40 5 Q 65 5, 65 10 L 65 110 Q 65 115, 40 115 Q 15 115, 15 110 Z" />
              </clipPath>
              <linearGradient id="oil-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a1a2e" />
                <stop offset="30%" stopColor="#16213e" />
                <stop offset="100%" stopColor="#0f3460" />
              </linearGradient>
              <linearGradient id="barrel-metal" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2a2a3a" />
                <stop offset="50%" stopColor="#3a3a4a" />
                <stop offset="100%" stopColor="#2a2a3a" />
              </linearGradient>
            </defs>

            {/* Barrel outline */}
            <path
              d="M 15 10 Q 15 5, 40 5 Q 65 5, 65 10 L 65 110 Q 65 115, 40 115 Q 15 115, 15 110 Z"
              fill="url(#barrel-metal)"
              stroke="#4a4a5a"
              strokeWidth="1.5"
            />

            {/* Oil fill */}
            <g clipPath="url(#barrel-clip)">
              <rect
                x="10"
                y={yForValue(current)}
                width="60"
                height={115 - yForValue(current)}
                fill="url(#oil-gradient)"
              />
              <rect
                x="10"
                y={yForValue(current)}
                width="60"
                height="2"
                fill="#58a6ff"
                opacity="0.4"
              />
            </g>

            {/* Barrel ribs */}
            <ellipse cx="40" cy="25" rx="25" ry="4" fill="none" stroke="#5a5a6a" strokeWidth="1" opacity="0.6" />
            <ellipse cx="40" cy="60" rx="25" ry="4" fill="none" stroke="#5a5a6a" strokeWidth="1" opacity="0.6" />
            <ellipse cx="40" cy="95" rx="25" ry="4" fill="none" stroke="#5a5a6a" strokeWidth="1" opacity="0.6" />

            {/* Historical low markers */}
            {SPR_LOWS.map((low) => {
              const y = yForValue(low.value);
              return (
                <g key={low.label}>
                  <line
                    x1="10"
                    y1={y}
                    x2="65"
                    y2={y}
                    stroke="#f85149"
                    strokeWidth="1"
                    strokeDasharray="3,2"
                    opacity="0.5"
                  />
                </g>
              );
            })}

            {/* Current level marker (right side) */}
            <line
              x1="65"
              y1={yForValue(current)}
              x2="73"
              y2={yForValue(current)}
              stroke={statusColor}
              strokeWidth="2"
            />
            <text
              x="75"
              y={yForValue(current) + 3}
              fill={statusColor}
              fontSize="6"
              fontFamily="monospace"
            >
              NOW
            </text>

            {/* Low markers labels (right side) */}
            {SPR_LOWS.map((low) => {
              const y = yForValue(low.value);
              return (
                <text
                  key={low.label}
                  x="75"
                  y={y + 3}
                  fill="#f85149"
                  fontSize="6"
                  fontFamily="monospace"
                  opacity="0.8"
                >
                  {low.date}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Stats */}
        <div className="w-full flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-foreground">
              {formatNumber(current, 1)}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              M bbl
            </span>
          </div>

          {/* Fill bar with low markers */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
                Capacity
              </span>
              <span className="font-mono text-[0.6rem] text-muted-foreground">
                {fillPct.toFixed(1)}%
              </span>
            </div>
            <div className="relative mt-1 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="absolute h-full rounded-full transition-all"
                style={{
                  width: `${fillPct}%`,
                  backgroundColor: statusColor,
                }}
              />
              {/* Low markers on the bar */}
              {SPR_LOWS.map((low) => {
                const markerPct = (low.value / SPR_MAX_CAPACITY) * 100;
                return (
                  <div
                    key={low.label}
                    className="absolute top-0 h-full"
                    style={{ left: `${markerPct}%` }}
                  >
                    <div className="h-full w-0.5 bg-red-500/50" />
                  </div>
                );
              })}
            </div>
            <div className="mt-0.5 flex justify-between font-mono text-[0.55rem] text-muted-foreground/60">
              <span>0</span>
              <span>727M (max)</span>
            </div>
          </div>

          {/* Low markers legend */}
          <div className="mt-3 space-y-1">
            {SPR_LOWS.map((low) => {
              const belowLow = current < low.value;
              const diff = low.value - current;
              return (
                <div key={low.label} className="flex items-center gap-2">
                  <span className="inline-block h-2 w-3 border-t border-dashed border-red-500/60" />
                  <span className="font-mono text-[0.6rem] text-muted-foreground">
                    {low.label}: {formatNumber(low.value, 1)}M
                  </span>
                  {belowLow && (
                    <span className="font-mono text-[0.6rem] font-bold text-red-400">
                      ↓ {formatNumber(diff, 1)}M below
                    </span>
                  )}
                </div>
                  );
                })}
          </div>

          {change !== null && (
            <div className="mt-3">
              <p className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
                Weekly Change
              </p>
              <p
                className="font-mono text-sm font-bold"
                style={{ color: isDeclining ? "#f85149" : "#3fb950" }}
              >
                {isDeclining ? "↓" : "↑"} {formatNumber(Math.abs(change), 1)}M bbl
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 border-t border-border pt-3 font-mono text-[0.55rem] leading-relaxed text-muted-foreground/60">
        Source: EIA Weekly Petroleum Status · Max capacity 727M bbl (2010 high) · Reserve drawn down {(100 - fillPct).toFixed(0)}% from peak
      </p>
    </div>
  );
}
