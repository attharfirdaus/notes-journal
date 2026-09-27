// One registry for every icon in the app.
//
// Keys are stable strings because some of them are stored in the database
// (`notes.icon`, `categories.icon`) and chosen by the user. Renaming a key means
// migrating those columns, so treat this list as a schema.

import { createElement } from "react";
import {
  Activity, Apple, Baby, Banknote, Bed, Bell, BellRing, Bike, Book, BookHeart, BookOpen, Brain,
  Briefcase, Bug, Calendar, CalendarClock, CalendarDays, Camera, Car, CheckCheck, ChefHat,
  CircleCheckBig, Clapperboard, Clock, Clover, CloudRain, CloudSun, Coffee, Compass, CreditCard,
  Crown, Dog, Droplets, Dumbbell, Feather, Film, Flame, Gamepad2, Gift, GraduationCap, Grid3x3,
  Hammer, Headphones, Heart, HeartPulse, Hourglass, House, Inbox, Laptop, Laugh, Leaf, Lightbulb,
  ListChecks, Luggage, Mail, Map, Meh, Mic, Moon, Music, Newspaper, NotebookPen, Nut, Package,
  Palette, PartyPopper, PenLine, Phone, PiggyBank, Pill, Plane, Rainbow, Receipt, Rocket, Salad,
  Scissors, Search, Settings, Shirt, ShoppingCart, Smile, Snowflake, Sparkles, Sprout, Star, Stars,
  Stethoscope, StickyNote, Sun, Sunrise, Tag, Tags, Target, Tent, Timer, Trash2, TreePine, Trophy,
  Wallet, WandSparkles, WashingMachine, Waves, Wind, Wrench, Frown, Angry, Lock, LockOpen, Repeat,
  type LucideIcon,
} from "lucide-react";

export const ICONS = {
  // everyday
  "shopping-cart": ShoppingCart, "list-checks": ListChecks, "check": CircleCheckBig,
  "calendar": CalendarDays, "note": StickyNote, "package": Package, "tag": Tag,
  // life
  "house": House, "gift": Gift, "heart": Heart, "star": Star, "baby": Baby, "dog": Dog,
  "shirt": Shirt, "laundry": WashingMachine, "chef": ChefHat, "salad": Salad, "apple": Apple,
  "coffee": Coffee,
  // work & study
  "briefcase": Briefcase, "book": BookOpen, "graduation": GraduationCap, "laptop": Laptop,
  "newspaper": Newspaper, "brain": Brain, "target": Target, "idea": Lightbulb, "pen": PenLine,
  // money
  "wallet": Wallet, "banknote": Banknote, "card": CreditCard, "piggy": PiggyBank,
  "receipt": Receipt,
  // health
  "dumbbell": Dumbbell, "pill": Pill, "stethoscope": Stethoscope, "pulse": HeartPulse,
  "bed": Bed, "activity": Activity,
  // going out
  "plane": Plane, "luggage": Luggage, "map": Map, "compass": Compass, "tent": Tent,
  "car": Car, "bike": Bike, "party": PartyPopper,
  // hobbies
  "music": Music, "palette": Palette, "gamepad": Gamepad2, "film": Film, "camera": Camera,
  "headphones": Headphones, "mic": Mic, "clapper": Clapperboard,
  // home & tools
  "wrench": Wrench, "hammer": Hammer, "scissors": Scissors, "phone": Phone, "bug": Bug,
  // nature & mood
  "sprout": Sprout, "leaf": Leaf, "tree": TreePine, "clover": Clover, "flame": Flame,
  "rainbow": Rainbow, "sun": Sun, "moon": Moon, "sparkles": Sparkles, "rocket": Rocket,
  "trophy": Trophy, "crown": Crown, "nut": Nut, "feather": Feather, "clock": Clock,
} as const satisfies Record<string, LucideIcon>;

/** Fixed chrome icons. Keyed too, so a Server Component can name one in a prop. */
export const UI_ICONS = {
  "ui-home": House, "ui-notes": NotebookPen, "ui-journal": BookHeart, "ui-focus": Timer,
  "ui-pixels": Grid3x3, "ui-capsules": Hourglass, "ui-categories": Tags,
  "ui-notifications": Bell, "ui-settings": Settings, "ui-inbox": Inbox, "ui-search": Search,
  "ui-mail": Mail, "ui-cloud-sun": CloudSun, "ui-nut": Nut,
} as const satisfies Record<string, LucideIcon>;

const ALL = { ...ICONS, ...UI_ICONS };

export type IconKey = keyof typeof ICONS;
export type IconName = keyof typeof ALL;

export const ICON_KEYS = Object.keys(ICONS) as IconKey[];

/** Fallback used when a stored key is unknown, so nothing ever renders blank. */
export const DEFAULT_ICON: IconKey = "note";

export function iconFor(key: string | null | undefined): LucideIcon {
  return ALL[key as IconName] ?? ICONS[DEFAULT_ICON];
}

export function isIconKey(key: string): key is IconKey {
  return key in ICONS;
}

/** Renders a stored icon key. */
export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 2.25,
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  // createElement, not <C />: the lookup returns an existing component, and
  // aliasing it to a capitalised local reads to the linter as a component
  // defined during render.
  return createElement(iconFor(name), { size, className, strokeWidth, "aria-hidden": true });
}

// ── Fixed icons used by the chrome, kept here so pages import from one place ──
export const UI = {
  home: House, notes: NotebookPen, journal: BookHeart, focus: Timer, pixels: Grid3x3,
  capsules: Hourglass, categories: Tags, notifications: Bell, settings: Settings, inbox: Inbox,
  brand: Nut, pet: Sparkles, streak: Flame, freeze: Snowflake, reminder: BellRing,
  due: CalendarClock, repeat: Repeat, locked: Lock, unlocked: LockOpen, mail: Mail,
  trash: Trash2, search: Search, done: CheckCheck, magic: WandSparkles, calendar: Calendar,
  book: Book, sunrise: Sunrise, cloudSun: CloudSun, moon: Moon, sun: Sun,
} satisfies Record<string, LucideIcon>;

export const MOOD_ICONS = [Angry, Frown, Meh, Smile, Laugh] satisfies LucideIcon[];

export const VIBE_ICONS = {
  none: Leaf, bubbles: Droplets, leaves: Leaf, stars: Stars, rain: CloudRain,
} satisfies Record<string, LucideIcon>;

export const THEME_ICONS = {
  sunny: Sun, ocean: Waves, forest: TreePine, candy: Sparkles, midnight: Moon,
} satisfies Record<string, LucideIcon>;

export const AMBIENT_ICONS = {
  rain: CloudRain, wind: Wind, brown: Waves, pink: Sparkles, white: Activity,
} satisfies Record<string, LucideIcon>;
