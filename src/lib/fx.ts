"use client";

import confetti from "canvas-confetti";

function motionAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.dataset.reduceMotion === "true") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function themeColors(): string[] {
  const s = getComputedStyle(document.documentElement);
  return ["--primary", "--accent", "--pet", "--line"].map((v) => s.getPropertyValue(v).trim()).filter(Boolean);
}

export function celebrate(kind: "small" | "big" = "small", origin?: { x: number; y: number }) {
  if (!motionAllowed()) return;
  const colors = themeColors();
  if (kind === "small") {
    confetti({ particleCount: 40, spread: 60, startVelocity: 30, scalar: 0.8, origin: origin ?? { y: 0.7 }, colors });
    return;
  }
  const end = Date.now() + 900;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function originFromEvent(e: { clientX: number; clientY: number }) {
  return { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
}

// ── Tiny synthesized sound effects (no audio files) ──────────────────────
let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.15) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  pop() {
    const a = audio();
    if (!a) return;
    const t = a.currentTime;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g).connect(a.destination);
    osc.start(t);
    osc.stop(t + 0.14);
  },
  chime() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.5, "triangle", 0.12));
  },
  tada() {
    [392, 523.25, 659.25].forEach((f, i) => tone(f, i * 0.07, 0.25, "square", 0.05));
    tone(783.99, 0.24, 0.6, "triangle", 0.12);
  },
  squeak() {
    tone(1200, 0, 0.08, "sine", 0.08);
    tone(1500, 0.08, 0.1, "sine", 0.08);
  },
};
