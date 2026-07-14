import Link from "next/link";

export function LockedCard({
  title,
  message,
  cta = "Sign up free",
  href = "/login",
}: {
  title: string;
  message: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
      <svg viewBox="0 0 24 24" className="mb-3 size-8 fill-none stroke-muted-foreground" strokeWidth="1.5">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 1 1 8 0v4" />
      </svg>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {message}
      </p>
      <Link
        href={href}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
      >
        {cta}
      </Link>
    </div>
  );
}

export function PremiumLockedCard({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
      <svg viewBox="0 0 24 24" className="mb-3 size-8 fill-none stroke-accent" strokeWidth="1.5">
        <path d="M12 2L15 8.5L22 9.3L17 14.1L18.2 21L12 17.8L5.8 21L7 14.1L2 9.3L9 8.5L12 2Z" />
      </svg>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {message}
      </p>
      <Link
        href="/upgrade"
        className="mt-4 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition hover:opacity-90"
      >
        Upgrade to Premium — $4.99/mo
      </Link>
    </div>
  );
}
