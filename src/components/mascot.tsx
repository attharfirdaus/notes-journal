"use client";

import { motion, useAnimationControls } from "motion/react";
import type { PetMood, PetStage } from "@/lib/pet";

const EYE = "#2E2320";
const BLUSH = "#FF8FA3";

function Eyes({ mood, y = 80, gap = 15, cx = 95 }: { mood: PetMood; y?: number; gap?: number; cx?: number }) {
  const l = cx - gap;
  const r = cx + gap;
  if (mood === "ecstatic") {
    return (
      <g stroke={EYE} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d={`M${l - 7} ${y + 3} Q${l} ${y - 7} ${l + 7} ${y + 3}`} />
        <path d={`M${r - 7} ${y + 3} Q${r} ${y - 7} ${r + 7} ${y + 3}`} />
      </g>
    );
  }
  if (mood === "sleepy") {
    return (
      <g stroke={EYE} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d={`M${l - 7} ${y + 1} Q${l} ${y + 6} ${l + 7} ${y + 1}`} />
        <path d={`M${r - 7} ${y + 1} Q${r} ${y + 6} ${r + 7} ${y + 1}`} />
      </g>
    );
  }
  const size = mood === "neutral" ? 6 : 7.5;
  return (
    <g>
      {mood === "sad" ? (
        <g stroke={EYE} strokeWidth={3} strokeLinecap="round">
          <path d={`M${l - 8} ${y - 12} L${l + 5} ${y - 16}`} />
          <path d={`M${r + 8} ${y - 12} L${r - 5} ${y - 16}`} />
        </g>
      ) : null}
      <g className="pet-blink">
        <circle cx={l} cy={y} r={size} fill={EYE} />
        <circle cx={r} cy={y} r={size} fill={EYE} />
        <circle cx={l + 2.5} cy={y - 2.5} r={2.4} fill="#fff" />
        <circle cx={r + 2.5} cy={y - 2.5} r={2.4} fill="#fff" />
      </g>
    </g>
  );
}

function Mouth({ mood, x = 95, y = 100 }: { mood: PetMood; x?: number; y?: number }) {
  switch (mood) {
    case "ecstatic":
      return <path d={`M${x - 9} ${y - 2} Q${x} ${y + 14} ${x + 9} ${y - 2} Z`} fill="#8C2F39" stroke={EYE} strokeWidth={2.5} strokeLinejoin="round" />;
    case "happy":
      return <path d={`M${x - 8} ${y} Q${x} ${y + 8} ${x + 8} ${y}`} fill="none" stroke={EYE} strokeWidth={3} strokeLinecap="round" />;
    case "sleepy":
      return <ellipse cx={x} cy={y + 2} rx={3.5} ry={4.5} fill={EYE} />;
    case "sad":
      return <path d={`M${x - 7} ${y + 5} Q${x} ${y - 2} ${x + 7} ${y + 5}`} fill="none" stroke={EYE} strokeWidth={3} strokeLinecap="round" />;
    default:
      return <path d={`M${x - 6} ${y + 1} Q${x - 3} ${y + 5} ${x} ${y + 1} Q${x + 3} ${y + 5} ${x + 6} ${y + 1}`} fill="none" stroke={EYE} strokeWidth={2.5} strokeLinecap="round" />;
  }
}

function Acorn({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={9} ry={11} fill="#E0A96D" />
      <path d="M-11 -2 Q0 -14 11 -2 Q0 3 -11 -2Z" fill="#8B5E34" />
      <rect x={-1.2} y={-15} width={2.4} height={5} rx={1} fill="#6B4423" />
    </g>
  );
}

function Sparkles() {
  return (
    <g fill="var(--accent)">
      {[
        [30, 40, 0],
        [170, 30, 0.6],
        [175, 110, 1.2],
        [22, 120, 1.8],
      ].map(([x, y, d]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x} ${y - 8} L${x + 2.5} ${y - 2.5} L${x + 8} ${y} L${x + 2.5} ${y + 2.5} L${x} ${y + 8} L${x - 2.5} ${y + 2.5} L${x - 8} ${y} L${x - 2.5} ${y - 2.5}Z`}
          style={{ animation: `vibe-twinkle 1.6s ${d}s ease-in-out infinite`, transformBox: "fill-box", transformOrigin: "center" }}
        />
      ))}
    </g>
  );
}

function Zzz() {
  return (
    <g fill="var(--ink-soft)" fontFamily="var(--font-display)" fontWeight={700}>
      <text x={140} y={55} fontSize={18} className="pet-z">z</text>
      <text x={150} y={40} fontSize={13} className="pet-z" style={{ animationDelay: "1.2s" }}>z</text>
    </g>
  );
}

function AcornStage({ mood, progress }: { mood: PetMood; progress: number }) {
  return (
    <g className="pet-breathe">
      <ellipse cx={100} cy={186} rx={42} ry={7} fill="var(--ink)" opacity={0.08} />
      <ellipse cx={100} cy={125} rx={46} ry={56} fill="#E0A96D" />
      <ellipse cx={82} cy={110} rx={10} ry={20} fill="#fff" opacity={0.25} />
      {progress >= 0.5 ? (
        <path d="M70 150 L80 140 L88 150 L97 138 L104 150" fill="none" stroke="#9C6B3C" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      <path d="M44 96 Q100 30 156 96 Q100 116 44 96Z" fill="#8B5E34" />
      <path d="M58 90 Q100 58 142 90" fill="none" stroke="#6B4423" strokeWidth={3} strokeDasharray="2 7" strokeLinecap="round" />
      <rect x={96} y={44} width={8} height={16} rx={4} fill="#6B4423" />
      <Eyes mood={mood} y={128} gap={16} cx={100} />
      <circle cx={75} cy={142} r={6} fill={BLUSH} opacity={0.55} />
      <circle cx={125} cy={142} r={6} fill={BLUSH} opacity={0.55} />
      <Mouth mood={mood} x={100} y={146} />
    </g>
  );
}

function SquirrelStage({ stage, mood }: { stage: Exclude<PetStage, "acorn">; mood: PetMood }) {
  return (
    <g>
      <ellipse cx={100} cy={188} rx={52} ry={7} fill="var(--ink)" opacity={0.08} />
      {/* tail */}
      <g className="pet-tail">
        <path d="M128 168 C196 168 204 86 168 52 C150 36 118 46 128 70 C140 94 164 118 126 146 Z" fill="var(--pet-dark)" />
        <path d="M140 150 C178 140 180 96 160 70" fill="none" stroke="var(--pet)" strokeWidth={9} strokeLinecap="round" opacity={0.55} />
      </g>
      <g className="pet-breathe">
        {/* body */}
        <ellipse cx={95} cy={140} rx={46} ry={42} fill="var(--pet)" />
        <ellipse cx={95} cy={148} rx={28} ry={28} fill="var(--pet-belly)" />
        <ellipse cx={73} cy={180} rx={15} ry={8} fill="var(--pet-dark)" />
        <ellipse cx={117} cy={180} rx={15} ry={8} fill="var(--pet-dark)" />
        {/* ears */}
        <path d="M60 60 L54 22 L84 46 Z" fill="var(--pet)" />
        <path d="M63 53 L60 32 L77 46 Z" fill="var(--pet-belly)" />
        <path d="M130 60 L136 22 L106 46 Z" fill="var(--pet)" />
        <path d="M127 53 L130 32 L113 46 Z" fill="var(--pet-belly)" />
        {/* head */}
        <circle cx={95} cy={82} r={41} fill="var(--pet)" />
        <ellipse cx={95} cy={98} rx={21} ry={15} fill="var(--pet-belly)" />
        {stage === "keeper" ? (
          <g>
            <path d="M70 46 Q95 22 120 46 L114 52 Q95 40 76 52 Z" fill="#5DBB63" />
            <path d="M95 28 Q88 14 95 6 Q102 14 95 28" fill="#74D17A" />
            <circle cx={95} cy={38} r={4} fill="var(--accent)" />
          </g>
        ) : null}
        <Eyes mood={mood} />
        <ellipse cx={95} cy={90} rx={4.5} ry={3.2} fill={EYE} />
        <circle cx={69} cy={97} r={6.5} fill={BLUSH} opacity={0.55} />
        <circle cx={121} cy={97} r={6.5} fill={BLUSH} opacity={0.55} />
        <Mouth mood={mood} y={99} />
        {stage !== "kit" ? (
          <g>
            <path d="M58 116 Q95 134 132 116 L130 126 Q95 144 60 126 Z" fill="var(--accent)" />
            <path d="M112 128 L120 150 L108 146 Z" fill="var(--accent)" />
          </g>
        ) : null}
        {/* paws + acorn */}
        <Acorn x={95} y={132} s={stage === "kit" ? 0.9 : 1.1} />
        <ellipse cx={82} cy={138} rx={8} ry={6} fill="var(--pet-dark)" />
        <ellipse cx={108} cy={138} rx={8} ry={6} fill="var(--pet-dark)" />
      </g>
    </g>
  );
}

export function Mascot({
  stage,
  mood,
  progress = 0,
  size = 160,
  onPet,
  label,
}: {
  stage: PetStage;
  mood: PetMood;
  progress?: number;
  size?: number;
  onPet?: () => void;
  label: string;
}) {
  const controls = useAnimationControls();
  const scale = stage === "kit" ? 0.86 : stage === "scout" ? 0.94 : 1;

  const handle = () => {
    void controls.start({
      y: [0, -22, 0, -8, 0],
      rotate: [0, -6, 6, -3, 0],
      transition: { duration: 0.7, ease: "easeOut" },
    });
    onPet?.();
  };

  return (
    <motion.button
      type="button"
      onClick={handle}
      animate={controls}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.94 }}
      aria-label={label}
      title={label}
      className="relative shrink-0 cursor-pointer rounded-full"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden>
        {mood === "ecstatic" ? <Sparkles /> : null}
        {mood === "sleepy" ? <Zzz /> : null}
        <g transform={`translate(${100 - 100 * scale} ${200 - 200 * scale}) scale(${scale})`}>
          {stage === "acorn" ? <AcornStage mood={mood} progress={progress} /> : <SquirrelStage stage={stage} mood={mood} />}
        </g>
      </svg>
    </motion.button>
  );
}
