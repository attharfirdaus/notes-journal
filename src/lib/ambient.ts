"use client";

// Procedurally generated ambience — no audio files, no licensing questions.

export type LayerId = "rain" | "wind" | "brown" | "pink" | "white";

export const LAYERS: { id: LayerId; label: string; emoji: string }[] = [
  { id: "rain", label: "Rain", emoji: "🌧️" },
  { id: "wind", label: "Wind", emoji: "🍃" },
  { id: "brown", label: "Deep hum", emoji: "🟤" },
  { id: "pink", label: "Soft static", emoji: "🌸" },
  { id: "white", label: "White noise", emoji: "⚪" },
];

function noiseBuffer(ctx: AudioContext, kind: "white" | "pink" | "brown", seconds = 4): AudioBuffer {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const out = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "white") out[i] = w * 0.5;
      else if (kind === "pink") {
        // Paul Kellet's refined pink noise filter.
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        last = (last + 0.02 * w) / 1.02;
        out[i] = last * 3.5;
      }
    }
  }
  return buf;
}

type Layer = { gain: GainNode; stop: () => void };

export class AmbientEngine {
  private ctx: AudioContext;
  private master: GainNode;
  private layers = new Map<LayerId, Layer>();
  private buffers = new Map<string, AudioBuffer>();

  constructor() {
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);
  }

  private buffer(kind: "white" | "pink" | "brown") {
    let b = this.buffers.get(kind);
    if (!b) {
      b = noiseBuffer(this.ctx, kind);
      this.buffers.set(kind, b);
    }
    return b;
  }

  private source(kind: "white" | "pink" | "brown") {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer(kind);
    src.loop = true;
    return src;
  }

  private lfo(freq: number, depth: number, target: AudioParam) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.value = freq;
    g.gain.value = depth;
    osc.connect(g).connect(target);
    osc.start();
    return osc;
  }

  private build(id: LayerId): Layer {
    const out = this.ctx.createGain();
    out.gain.value = 0;
    out.connect(this.master);
    const nodes: AudioScheduledSourceNode[] = [];

    if (id === "white" || id === "pink") {
      const s = this.source(id);
      s.connect(out);
      nodes.push(s);
    } else if (id === "brown") {
      const s = this.source("brown");
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 500;
      s.connect(lp).connect(out);
      nodes.push(s);
    } else if (id === "rain") {
      const s = this.source("pink");
      const hp = this.ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 500;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 7000;
      const shimmer = this.ctx.createGain();
      shimmer.gain.value = 0.85;
      s.connect(hp).connect(lp).connect(shimmer).connect(out);
      nodes.push(s, this.lfo(0.23, 0.12, shimmer.gain));
      // Occasional heavier drops.
      const d = this.source("white");
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2500;
      bp.Q.value = 3;
      const dg = this.ctx.createGain();
      dg.gain.value = 0.25;
      d.connect(bp).connect(dg).connect(out);
      nodes.push(d, this.lfo(7.3, 0.2, dg.gain));
    } else if (id === "wind") {
      const s = this.source("brown");
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 420;
      bp.Q.value = 0.9;
      const g = this.ctx.createGain();
      g.gain.value = 1.2;
      s.connect(bp).connect(g).connect(out);
      nodes.push(s, this.lfo(0.07, 260, bp.frequency), this.lfo(0.11, 0.5, g.gain));
    }

    nodes.forEach((n) => {
      try {
        n.start();
      } catch {}
    });
    return {
      gain: out,
      stop: () => nodes.forEach((n) => {
        try {
          n.stop();
        } catch {}
      }),
    };
  }

  async resume() {
    if (this.ctx.state === "suspended") await this.ctx.resume();
  }

  async suspend() {
    if (this.ctx.state === "running") await this.ctx.suspend();
  }

  setVolume(id: LayerId, v: number) {
    let layer = this.layers.get(id);
    if (!layer && v > 0) {
      layer = this.build(id);
      this.layers.set(id, layer);
    }
    if (layer) layer.gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.3);
  }

  setMaster(v: number) {
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.2);
  }

  chime() {
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.15 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.15 + 0.9);
      o.connect(g).connect(this.ctx.destination);
      o.start(t + i * 0.15);
      o.stop(t + i * 0.15 + 1);
    });
  }

  close() {
    this.layers.forEach((l) => l.stop());
    void this.ctx.close();
  }
}
