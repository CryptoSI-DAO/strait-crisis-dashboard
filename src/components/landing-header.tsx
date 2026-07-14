"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthModal } from "./auth-modal";

export function LandingHeader() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-primary" strokeWidth="2">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
                <path d="M2 7l10 5 10-5" />
                <path d="M12 22V12" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight sm:text-base">
              Strait Crisis
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-lg px-3 py-1.5 font-mono text-[0.7rem] font-medium text-muted-foreground transition hover:text-foreground sm:text-sm"
            >
              Sign in
            </button>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-mono text-[0.7rem] font-semibold text-primary-foreground transition hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
            >
              Open App
              <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
