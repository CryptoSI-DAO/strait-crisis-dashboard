"use client";

import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpgrade() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login?redirect=upgrade");
      return;
    }

    try {
      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error ?? "Failed to create checkout session");
      }

      const { url } = await resp.json();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-accent/30 bg-card p-8 shadow-lg" style={{ boxShadow: "0 0 40px rgba(240, 180, 41, 0.1)" }}>
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-accent/10">
              <svg viewBox="0 0 24 24" className="size-7 fill-none stroke-accent" strokeWidth="1.5">
                <path d="M12 2L15 8.5L22 9.3L17 14.1L18.2 21L12 17.8L5.8 21L7 14.1L2 9.3L9 8.5L12 2Z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Premium</h1>
            <p className="mt-1 text-sm text-muted-foreground">Unlock the full dashboard</p>
          </div>

          <div className="mt-6 space-y-3">
            {[
              "SPR barrel with historical lows",
              "90-day price history on all charts",
              "Tanker shipping stress index",
              "3:2:1 crack spread tracking",
              "Brent-WTI spread analysis",
              "Dollar divergence signal",
              "CSV data export",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-none stroke-success" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-6 text-center">
            <p className="font-mono text-3xl font-bold text-foreground">
              $4.99<span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Cancel anytime</p>
          </div>

          {error && (
            <p className="mt-4 text-center text-xs text-danger">{error}</p>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Redirecting to Stripe..." : "Upgrade now"}
          </button>

          <a
            href="/dashboard"
            className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </a>
        </div>
      </div>
    </main>
  );
}
