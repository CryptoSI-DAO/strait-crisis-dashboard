"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const initial = saved ?? (prefersLight ? "light" : "dark");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  if (!mounted) {
    return <div className="h-9 w-16 rounded-full bg-muted" />;
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-3"
      aria-label="Toggle theme"
    >
      {/* Track */}
      <div
        className={`relative flex h-9 w-16 items-center rounded-full border transition-colors ${
          theme === "dark"
            ? "border-primary/30 bg-primary/10"
            : "border-accent/30 bg-accent/10"
        }`}
      >
        {/* Knob */}
        <div
          className={`absolute flex size-7 items-center justify-center rounded-full shadow-md transition-transform duration-300 ${
            theme === "dark"
              ? "translate-x-1 bg-[#0a0e14]"
              : "translate-x-8 bg-white"
          }`}
        >
          {theme === "dark" ? (
            // Moon icon
            <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-[#58a6ff]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            // Sun icon
            <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-[#d4a017]" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.29-1.29M18.36 5.64l1.42-1.42" />
            </svg>
          )}
        </div>
      </div>
      <span className="font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
        {theme === "dark" ? "Dark" : "Light"}
      </span>
    </button>
  );
}
