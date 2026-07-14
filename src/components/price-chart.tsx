import { cn } from "@/lib/utils";

interface ChartPoint {
  recorded_at: string;
  value: number;
}

export function PriceChart({
  data,
  label,
  unit,
  className,
  height = 180,
}: {
  data: ChartPoint[];
  label: string;
  unit: string;
  className?: string;
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-border bg-card",
          className,
        )}
        style={{ height }}
      >
        <p className="font-mono text-xs text-muted-foreground">
          Not enough data for chart
        </p>
      </div>
    );
  }

  const width = 600;
  const padding = { top: 15, right: 15, bottom: 25, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xStep = chartWidth / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + chartHeight - ((d.value - min) / range) * chartHeight,
    value: d.value,
    date: d.recorded_at,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = min + (range * i) / yTicks;
    return { val, y: padding.top + chartHeight - (i / yTicks) * chartHeight };
  });

  const xLabelCount = Math.min(data.length, 6);
  const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.floor((i / (xLabelCount - 1)) * (data.length - 1));
    return points[idx];
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card p-3 sm:p-4",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <h3 className="text-xs font-semibold text-foreground sm:text-sm">{label}</h3>
        <span className="font-mono text-[0.65rem] text-muted-foreground sm:text-xs">{unit}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        style={{ maxHeight: height }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`grad-${label.replace(/\s/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yLabels.map((tick, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke="var(--border)"
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
            <text
              x={padding.left - 8}
              y={tick.y + 3}
              textAnchor="end"
              className="fill-muted-foreground font-mono"
              style={{ fontSize: "9px" }}
            >
              {tick.val.toFixed(tick.val < 10 ? 2 : 0)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill={`url(#grad-${label.replace(/\s/g, "-")})`} />
        <path
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />

        {xLabels.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            className="fill-muted-foreground font-mono"
            style={{ fontSize: "9px" }}
          >
            {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </text>
        ))}

        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill="var(--primary)"
        />
      </svg>
    </div>
  );
}
