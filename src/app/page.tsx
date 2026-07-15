import { LandingHeader } from "@/components/landing-header";
import { getCurrentUser } from "@/lib/supabase-server";
import { getLatestMetrics } from "@/lib/supabase";
import { computeThreatScore } from "@/lib/threat-score";
import { formatCurrency } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { getLivePrices, mergeLiveWithStored } from "@/lib/live-prices";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Strait Crisis Dashboard — Macro Energy Security Monitor",
  description:
    "Track oil prices, SPR drawdowns, tanker stress, and the composite threat score in real time. The cleanest macro energy security dashboard on the internet.",
};

export default async function LandingPage() {
  const user = await getCurrentUser();

  // Fetch live data
  const storedMetrics = await getLatestMetrics();
  const livePrices = await getLivePrices();
  const metrics = mergeLiveWithStored(storedMetrics, livePrices);
  const threatScore = await computeThreatScore();
  const wti = metrics.find((m) => m.metric_key === "wti_crude");
  const brent = metrics.find((m) => m.metric_key === "brent_crude");
  const spr = metrics.find((m) => m.metric_key === "spr_inventory");

  const threatLabel = threatScore.level;
  const threatColor = threatScore.color;


  return (
    <main className="min-h-screen overflow-x-hidden">
      <LandingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
          {/* Logo */}
          <div className="mx-auto mb-6">
            <img
              src="/logo.png"
              alt="Strait Crisis logo"
              width={96}
              height={96}
              className="rounded-2xl"
            />
          </div>

          {/* Threat level badge */}
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-4 py-1.5">
            <span className="size-2 animate-pulse rounded-full bg-warning" />
            <span className="font-mono text-[0.65rem] tracking-wider text-warning uppercase sm:text-xs">
              {threatLabel} — Score: {threatScore.total}/100
            </span>
          </div>

          <h1 className="mx-auto max-w-3xl text-3xl font-black tracking-tight sm:text-5xl sm:leading-[1.1]">
            The Strait of Hormuz is the world's most important chokepoint.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Track every signal that matters — oil prices, SPR drawdowns, tanker stress, crack spreads, and the dollar. One composite threat score. Zero noise.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              Open Dashboard
              <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a
              href="#pricing"
              className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              View Pricing
            </a>
          </div>

          {/* Quick stats */}
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "WTI Crude", value: wti ? formatCurrency(wti.value) : "—" },
              { label: "Brent", value: brent ? formatCurrency(brent.value) : "—" },
              { label: "SPR", value: spr ? `${spr.value}M bbl` : "—" },
              { label: "Threat", value: threatLabel },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card/50 p-3">
                <p className="font-mono text-[0.55rem] tracking-wider text-muted-foreground uppercase">
                  {stat.label}
                </p>
                <p className="mt-1 font-mono text-base font-bold sm:text-lg">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Everything you need. Nothing you don't.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
            Built for traders, analysts, and anyone who needs to know if the energy market is about to flip.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Composite Threat Score",
                desc: "7 weighted signals — oil momentum, tanker stress, SPR drawdown, crack spreads, dollar divergence — combined into one 0-100 score.",
                icon: (
                  <circle cx="12" cy="12" r="9" />
                ),
              },
              {
                title: "SPR Barrel Visualization",
                desc: "Watch the Strategic Petroleum Reserve drain in real time. Historical lows marked. 727M peak to 319M today.",
                icon: (
                  <path d="M5 8h14l-1 12H6L5 8z M9 8V6a3 3 0 0 1 6 0v2" />
                ),
              },
              {
                title: "Tanker Shipping Index",
                desc: "Composite of 5 major tanker stocks — Frontline, Nordic American, Scorpio, Teekay, International Seaways.",
                icon: (
                  <path d="M3 18l2-6h14l2 6M5 12V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v5" />
                ),
              },
              {
                title: "90-Day Price History",
                desc: "Brent, WTI, crack spreads, dollar index — full 90-day charts on premium. Spot trends before they become headlines.",
                icon: (
                  <path d="M3 17l6-6 4 4 7-7M17 8h4v4" />
                ),
              },
              {
                title: "Daily Data Refresh",
                desc: "Automated collection via EIA API + Yahoo Finance. Fresh data every morning at 7am UTC. No stale numbers.",
                icon: (
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
                ),
              },
              {
                title: "Mobile Optimized",
                desc: "Responsive design that works as well on your phone as your desktop. Check the threat level anywhere.",
                icon: (
                  <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2" />
                ),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/30"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-primary" strokeWidth="1.5">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            Simple pricing
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground sm:text-base">
            Free gets you the signal. Premium gets you the full picture.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6">
            {/* Free */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <p className="font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">Free</p>
              <p className="mt-2 font-mono text-3xl font-bold">$0</p>
              <p className="mt-1 text-xs text-muted-foreground">forever</p>

              <div className="mt-6 space-y-2.5">
                {[
                  "Composite threat level + score",
                  "WTI + Brent summary prices",
                  "2 charts (Brent, WTI)",
                  "30-day chart history",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-none stroke-success" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <a
                href="/dashboard"
                className="mt-6 block w-full rounded-lg border border-border py-2.5 text-center text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Open Dashboard
              </a>
            </div>

            {/* Premium */}
            <div
              className="relative rounded-2xl border border-accent/40 bg-card p-6 sm:p-8"
              style={{ boxShadow: "0 0 40px rgba(240, 180, 41, 0.08)" }}
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5">
                <span className="font-mono text-[0.55rem] font-bold tracking-wider text-accent-foreground uppercase">Best Value</span>
              </div>

              <p className="font-mono text-[0.65rem] tracking-wider text-accent uppercase">Premium</p>
              <p className="mt-2 font-mono text-3xl font-bold">$4.99<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
              <p className="mt-1 text-xs text-muted-foreground">cancel anytime</p>

              <div className="mt-6 space-y-2.5">
                {[
                  "Everything in Free, plus:",
                  "SPR barrel with historical lows",
                  "All 8 metric cards",
                  "Tanker + crack spread charts",
                  "90-day chart history",
                  "Full threat score breakdown",
                ].map((item, i) => (
                  <div key={item} className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className={`size-4 shrink-0 fill-none ${i === 0 ? "stroke-transparent" : "stroke-accent"}`} strokeWidth="2.5">
                      {i === 0 ? null : <path d="M5 13l4 4L19 7" />}
                    </svg>
                    <span className={`text-sm ${i === 0 ? "font-semibold text-foreground" : "text-foreground"}`}>{item}</span>
                  </div>
                ))}
              </div>

              <a
                href={user ? "/upgrade" : "/login?redirect=upgrade"}
                className="mt-6 block w-full rounded-lg bg-accent py-2.5 text-center text-sm font-bold text-accent-foreground transition hover:opacity-90"
              >
                {user ? "Upgrade now" : "Get Premium"}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Telegram CTA */}
      <section className="border-t border-border py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-[#229ED9]/15">
            <svg viewBox="0 0 24 24" className="size-6 fill-[#229ED9]">
              <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Get real-time alerts on Telegram
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Join our broadcast channel for daily threat score updates, alert notifications when the level changes, and weekend briefings.
          </p>
          <a
            href="https://t.me/straitcrisis"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#229ED9] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Join Channel
            <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
          <p className="mt-2 text-[0.65rem] text-muted-foreground/60">
            Free to join · No spam · Unsubscribe anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>Strait Crisis Dashboard — Macro Energy Security Monitor</p>
          <p className="font-mono">Research only. Not financial advice.</p>
        </div>
      </footer>
    </main>
  );
}
