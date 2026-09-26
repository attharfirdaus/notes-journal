import type { ThemeId, Vibe } from "./types";

type Palette = {
  bg: string;
  soft: string;
  card: string;
  ink: string;
  inkSoft: string;
  primary: string;
  primaryInk: string;
  accent: string;
  line: string;
  pet: string;
  petDark: string;
  petBelly: string;
};

export type Theme = { id: ThemeId; name: string; emoji: string; light: Palette; dark: Palette };

export const THEMES: Theme[] = [
  {
    id: "sunny",
    name: "Sunny Pastel",
    emoji: "🌻",
    light: {
      bg: "#FFF8E7", soft: "#FFEFC7", card: "#FFFFFF", ink: "#3B2F2A", inkSoft: "#6E5D52",
      primary: "#FF8A3D", primaryInk: "#2B1A0E", accent: "#FFD166", line: "#F1E1BD",
      pet: "#E39B5C", petDark: "#A8652E", petBelly: "#FFE6C7",
    },
    dark: {
      bg: "#1F1A14", soft: "#2A231A", card: "#30281E", ink: "#FFF3DC", inkSoft: "#D2BFA0",
      primary: "#FFA25C", primaryInk: "#1F1408", accent: "#FFD166", line: "#4A3D2C",
      pet: "#E39B5C", petDark: "#A8652E", petBelly: "#FFE6C7",
    },
  },
  {
    id: "ocean",
    name: "Ocean Breeze",
    emoji: "🌊",
    light: {
      bg: "#EEF8FF", soft: "#DCEFFD", card: "#FFFFFF", ink: "#16324F", inkSoft: "#4B6886",
      primary: "#38BDF8", primaryInk: "#08243A", accent: "#FF9F9F", line: "#CBE3F5",
      pet: "#7AAFE0", petDark: "#3F76AB", petBelly: "#E3F2FF",
    },
    dark: {
      bg: "#0B1B2B", soft: "#10263A", card: "#132B42", ink: "#E6F4FF", inkSoft: "#A3BED8",
      primary: "#4CC9FF", primaryInk: "#061828", accent: "#FF9F9F", line: "#22405C",
      pet: "#7AAFE0", petDark: "#3F76AB", petBelly: "#E3F2FF",
    },
  },
  {
    id: "forest",
    name: "Forest Cozy",
    emoji: "🌲",
    light: {
      bg: "#F2F7EE", soft: "#E2EFD8", card: "#FFFFFF", ink: "#1F3324", inkSoft: "#526A57",
      primary: "#5DBB63", primaryInk: "#0D210F", accent: "#F4C06A", line: "#D0E2C4",
      pet: "#C98B5A", petDark: "#8C5A33", petBelly: "#F6E3CF",
    },
    dark: {
      bg: "#121C14", soft: "#17251A", card: "#1C2C20", ink: "#E8F5E4", inkSoft: "#A9C2AC",
      primary: "#74D17A", primaryInk: "#0B170C", accent: "#F4C06A", line: "#2C4230",
      pet: "#C98B5A", petDark: "#8C5A33", petBelly: "#F6E3CF",
    },
  },
  {
    id: "candy",
    name: "Candy Pop",
    emoji: "🍬",
    light: {
      bg: "#FFF0F7", soft: "#FFDFEE", card: "#FFFFFF", ink: "#4A1D3A", inkSoft: "#814E6F",
      primary: "#FF6FB5", primaryInk: "#34061F", accent: "#7FE3F7", line: "#F6CBE0",
      pet: "#F29BC0", petDark: "#C25D8A", petBelly: "#FFE8F2",
    },
    dark: {
      bg: "#22121D", soft: "#2D1826", card: "#351C2D", ink: "#FFE6F3", inkSoft: "#DBA9C6",
      primary: "#FF85C2", primaryInk: "#240A18", accent: "#7FE3F7", line: "#4F2A43",
      pet: "#F29BC0", petDark: "#C25D8A", petBelly: "#FFE8F2",
    },
  },
  {
    id: "midnight",
    name: "Midnight Dream",
    emoji: "🌙",
    light: {
      bg: "#F1F0FF", soft: "#E3E0FF", card: "#FFFFFF", ink: "#221E4A", inkSoft: "#57528A",
      primary: "#8B7CF6", primaryInk: "#120E33", accent: "#5EEAD4", line: "#D6D2FA",
      pet: "#9D8CF0", petDark: "#6552C4", petBelly: "#EEEAFF",
    },
    dark: {
      bg: "#0E0B24", soft: "#151133", card: "#1B163F", ink: "#ECEAFF", inkSoft: "#ACA7DB",
      primary: "#A594FF", primaryInk: "#0E0B24", accent: "#5EEAD4", line: "#2E2863",
      pet: "#9D8CF0", petDark: "#6552C4", petBelly: "#EEEAFF",
    },
  },
];

export const VIBES: { id: Vibe; name: string; emoji: string }[] = [
  { id: "none", name: "Calm", emoji: "🍃" },
  { id: "bubbles", name: "Bubbles", emoji: "🫧" },
  { id: "leaves", name: "Falling leaves", emoji: "🍂" },
  { id: "stars", name: "Starry night", emoji: "✨" },
  { id: "rain", name: "Rainy day", emoji: "🌧️" },
];

function vars(p: Palette): string {
  return [
    `--bg:${p.bg}`,
    `--soft:${p.soft}`,
    `--card:${p.card}`,
    `--ink:${p.ink}`,
    `--ink-soft:${p.inkSoft}`,
    `--primary:${p.primary}`,
    `--primary-ink:${p.primaryInk}`,
    `--accent:${p.accent}`,
    `--line:${p.line}`,
    `--pet:${p.pet}`,
    `--pet-dark:${p.petDark}`,
    `--pet-belly:${p.petBelly}`,
  ].join(";");
}

/** CSS for every theme × mode. Rendered once in the root layout. */
export function themeCss(): string {
  return THEMES.map((t) => {
    const light = vars(t.light);
    const dark = vars(t.dark);
    return [
      `[data-theme="${t.id}"]{${light};color-scheme:light}`,
      `[data-theme="${t.id}"][data-mode="dark"]{${dark};color-scheme:dark}`,
      `@media (prefers-color-scheme: dark){[data-theme="${t.id}"][data-mode="system"]{${dark};color-scheme:dark}}`,
    ].join("\n");
  }).join("\n");
}

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
