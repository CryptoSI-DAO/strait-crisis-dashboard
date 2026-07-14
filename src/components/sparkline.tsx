import { cn } from "@/lib/utils";

export function Sparkline({
  data,
  className,
  positive = true,
}: {
  data: number[];
  className?: string;
  positive?: boolean;
}) {
  if (data.length < 2) return null;

  const width = 100;
  const height = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const stroke = positive ? "var(--success)" : "var(--danger)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-8 w-full", className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={stroke}
        opacity="0.1"
      />
    </svg>
  );
}
