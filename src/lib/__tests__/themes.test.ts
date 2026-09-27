import { describe, expect, it } from "vitest";
import { THEMES } from "../themes";

function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

describe("theme contrast (WCAG AA)", () => {
  for (const t of THEMES) {
    for (const mode of ["light", "dark"] as const) {
      const p = t[mode];
      it(`${t.id}/${mode}`, () => {
        expect(contrast(p.ink, p.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.ink, p.card)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.inkSoft, p.card)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.inkSoft, p.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.primaryInk, p.primary)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
