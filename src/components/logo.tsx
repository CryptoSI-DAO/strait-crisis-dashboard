export function Logo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className={className}
      aria-label="Strait Crisis logo"
    >
      {/* Left landmass (Iran-side) — bold, defined */}
      <path
        d="M6 10 L26 10 Q34 10 34 18 L34 28 Q34 34 28 34 L24 34 Q20 34 20 38 L20 42 Q20 46 24 46 L32 46 Q40 46 40 54 L40 72"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right landmass (Musandam/Oman-side) — lighter, offset */}
      <path
        d="M74 10 L54 10 Q46 10 46 18 L46 28 Q46 34 52 34 L56 34 Q60 34 60 38 L60 42 Q60 46 56 46 L48 46 Q40 46 40 54 L40 72"
        fill="none"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.35"
      />
      {/* Vessel/data point in the strait */}
      <circle cx="40" cy="50" r="3.5" fill="var(--color-warning, #f0b429)" />
      {/* Pulse rings around the vessel */}
      <circle cx="40" cy="50" r="7" fill="none" stroke="var(--color-warning, #f0b429)" strokeWidth="1" opacity="0.4" />
      <circle cx="40" cy="50" r="11" fill="none" stroke="var(--color-warning, #f0b429)" strokeWidth="0.75" opacity="0.2" />
    </svg>
  );
}
