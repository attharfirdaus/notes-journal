// Acorn artwork for generated app icons (rendered by next/og, so plain SVG only).
export function AcornIcon({ size, padding = 0.16, background = "#FFD166" }: { size: number; padding?: number; background?: string }) {
  const inner = size * (1 - padding * 2);
  return (
    <div
      style={{
        width: size,
        height: size,
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: padding > 0.1 ? 0 : size * 0.22,
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 200 200">
        <ellipse cx="100" cy="125" rx="52" ry="62" fill="#E0A96D" />
        <ellipse cx="80" cy="110" rx="11" ry="22" fill="#fff" opacity="0.3" />
        <path d="M40 92 Q100 22 160 92 Q100 116 40 92Z" fill="#8B5E34" />
        <rect x="95" y="30" width="10" height="20" rx="5" fill="#6B4423" />
        <circle cx="82" cy="128" r="8" fill="#2E2320" />
        <circle cx="118" cy="128" r="8" fill="#2E2320" />
        <circle cx="85" cy="125" r="2.6" fill="#fff" />
        <circle cx="121" cy="125" r="2.6" fill="#fff" />
        <path d="M90 146 Q100 156 110 146" fill="none" stroke="#2E2320" strokeWidth="4" strokeLinecap="round" />
        <circle cx="70" cy="144" r="7" fill="#FF8FA3" opacity="0.6" />
        <circle cx="130" cy="144" r="7" fill="#FF8FA3" opacity="0.6" />
      </svg>
    </div>
  );
}
