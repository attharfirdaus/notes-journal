"use client";

import { useMemo } from "react";
import type { Vibe } from "@/lib/types";

// Deterministic pseudo-random so server and client render identical markup.
function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function VibeBackground({ vibe }: { vibe: Vibe }) {
  const particles = useMemo(() => {
    const count = vibe === "rain" ? 40 : vibe === "stars" ? 36 : 16;
    return Array.from({ length: count }, (_, i) => ({
      left: seeded(i + 1) * 100,
      top: seeded(i + 101) * 100,
      delay: seeded(i + 201) * (vibe === "rain" ? 2 : 14),
      duration: vibe === "rain" ? 0.9 + seeded(i + 301) * 0.8 : 12 + seeded(i + 301) * 14,
      size: 0.5 + seeded(i + 401),
      dx: (seeded(i + 501) - 0.5) * 120,
    }));
  }, [vibe]);

  if (vibe === "none") return null;

  return (
    <div className="vibe-layer" aria-hidden>
      {particles.map((p, i) => {
        const base = { left: `${p.left}%`, animationDelay: `-${p.delay}s`, animationDuration: `${p.duration}s` } as React.CSSProperties;
        const vars = { "--dx": `${p.dx}px`, "--s": p.size, "--rot": `${p.dx * 4}deg` } as React.CSSProperties;
        switch (vibe) {
          case "bubbles":
            return (
              <span
                key={i}
                className="vibe-particle rounded-full border-2"
                style={{
                  ...base, ...vars,
                  width: 18 + p.size * 26, height: 18 + p.size * 26,
                  borderColor: "color-mix(in oklab, var(--primary) 45%, transparent)",
                  background: "color-mix(in oklab, var(--primary) 10%, transparent)",
                  animationName: "vibe-rise", animationTimingFunction: "linear", animationIterationCount: "infinite",
                }}
              />
            );
          case "leaves":
            return (
              <span
                key={i}
                className="vibe-particle select-none"
                style={{
                  ...base, ...vars, fontSize: 14 + p.size * 14, opacity: 0.7,
                  animationName: "vibe-fall", animationTimingFunction: "linear", animationIterationCount: "infinite",
                }}
              >
                {["🍂", "🍃", "🍁"][i % 3]}
              </span>
            );
          case "stars":
            return (
              <span
                key={i}
                className="vibe-particle rounded-full"
                style={{
                  left: `${p.left}%`, top: `${p.top}%`,
                  width: 2 + p.size * 3, height: 2 + p.size * 3,
                  background: i % 4 === 0 ? "var(--accent)" : "var(--primary)",
                  boxShadow: "0 0 8px var(--primary)",
                  animation: `vibe-twinkle ${2 + p.size * 3}s ${-p.delay}s ease-in-out infinite`,
                }}
              />
            );
          case "rain":
            return (
              <span
                key={i}
                className="vibe-particle"
                style={{
                  ...base,
                  width: 2, height: 18 + p.size * 14, borderRadius: 2,
                  background: "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--primary) 50%, transparent))",
                  animationName: "vibe-rain", animationTimingFunction: "linear", animationIterationCount: "infinite",
                }}
              />
            );
        }
      })}
    </div>
  );
}
