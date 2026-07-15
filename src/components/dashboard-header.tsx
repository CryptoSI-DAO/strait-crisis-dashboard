import Link from "next/link";
import type { User } from "@/lib/supabase-server";

export function DashboardHeader({
  user,
  lastUpdate,
}: {
  user: User | null;
  lastUpdate?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-8 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo.png" alt="logo" width={30} height={30} className="rounded-md" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-tight sm:text-lg">
              Strait Crisis Dashboard
            </h1>
            <p className="hidden font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase sm:block">
              Macro Energy Security Monitor
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {lastUpdate && (
            <div className="hidden text-right md:block">
              <p className="font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
                Last Update
              </p>
              <p className="font-mono text-xs text-foreground">
                {new Date(lastUpdate).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
          <div className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 sm:px-3 sm:py-1.5">
            <span className="size-2 animate-pulse rounded-full bg-success" />
            <span className="font-mono text-[0.65rem] text-muted-foreground sm:text-xs">LIVE</span>
          </div>

          {/* Auth links */}
          {user ? (
            <Link
              href="/account"
              className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 sm:px-3 sm:py-1.5 transition hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current sm:size-4" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
              </svg>
              <span className="hidden font-mono text-[0.65rem] text-foreground sm:inline sm:text-xs">
                {user.tier === "premium" ? "Premium" : "Account"}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-mono text-[0.65rem] font-semibold text-primary-foreground transition hover:opacity-90 sm:text-xs"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
