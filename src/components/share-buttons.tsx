"use client";

import { useState } from "react";

const SHARE_URL = "https://strait-crisis-dashboard.vercel.app";
const SHARE_TEXT = "Tracking oil prices, SPR levels, and the Strait of Hormuz threat level in real-time — Strait Crisis Dashboard";

export function ShareButtons() {
  const [copied, setCopied] = useState(false);

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Strait Crisis Dashboard",
          text: SHARE_TEXT,
          url: SHARE_URL,
        });
      } catch {
        // User cancelled — no action needed
      }
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(SHARE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }

  const platforms = [
    {
      name: "X",
      color: "#000000",
      bg: "bg-[#000000]",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SHARE_URL)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="size-4 fill-white" strokeWidth="0">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "WhatsApp",
      color: "#25D366",
      bg: "bg-[#25D366]",
      href: `https://wa.me/?text=${encodeURIComponent(SHARE_TEXT + " " + SHARE_URL)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="size-4 fill-white" strokeWidth="0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      ),
    },
    {
      name: "Telegram",
      color: "#29a9eb",
      bg: "bg-[#29a9eb]",
      href: `https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="size-4 fill-white" strokeWidth="0">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      color: "#1877F2",
      bg: "bg-[#1877F2]",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="size-4 fill-white" strokeWidth="0">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "Email",
      color: "#6b7280",
      bg: "bg-muted",
      href: `mailto:?subject=${encodeURIComponent("Check out Strait Crisis Dashboard")}&body=${encodeURIComponent(SHARE_TEXT + "\n\n" + SHARE_URL)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 7L2 7" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Native share button (mobile) */}
      <button
        onClick={handleNativeShare}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Share Strait Crisis
      </button>

      {/* Platform buttons */}
      <div className="grid grid-cols-5 gap-2">
        {platforms.map((p) => (
          <a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${p.name}`}
            className={`flex aspect-square items-center justify-center rounded-lg ${p.bg} text-white transition hover:opacity-80`}
            title={`Share on ${p.name}`}
          >
            {p.icon}
          </a>
        ))}
      </div>

      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground"
      >
        {copied ? (
          <>
            <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-success" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-success">Link copied!</span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Copy link
          </>
        )}
      </button>
    </div>
  );
}
