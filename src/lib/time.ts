// Time-zone helpers built on Intl only. Every date shown to the user is
// rendered in their profile time zone so server and client agree.

const partsCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(tz: string) {
  let f = partsCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsCache.set(tz, f);
  }
  return f;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function zonedParts(tz: string, at: Date = new Date()) {
  const p = Object.fromEntries(partsFormatter(tz).formatToParts(at).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

/** Offset of `tz` from UTC in minutes at instant `at` (e.g. Asia/Jakarta → 420). */
export function tzOffsetMinutes(tz: string, at: Date = new Date()): number {
  const p = zonedParts(tz, at);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUTC - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD in the given zone. */
export function todayInTz(tz: string, at: Date = new Date()): string {
  const p = zonedParts(tz, at);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function localHour(tz: string, at: Date = new Date()): number {
  return zonedParts(tz, at).hour;
}

/** Wall-clock components in `tz` → UTC ISO string (DST-safe). */
export function zonedToIso(
  tz: string,
  y: number,
  mo: number,
  d: number,
  h = 0,
  mi = 0,
): string {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let ts = guess - tzOffsetMinutes(tz, new Date(guess)) * 60000;
  // Second pass settles DST transitions.
  ts = guess - tzOffsetMinutes(tz, new Date(ts)) * 60000;
  return new Date(ts).toISOString();
}

/** `<input type="datetime-local">` value interpreted in `tz` → ISO. */
export function zonedInputToIso(value: string, tz: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  return zonedToIso(tz, +m[1], +m[2], +m[3], +m[4], +m[5]);
}

/** ISO → `<input type="datetime-local">` value in `tz`. */
export function isoToZonedInput(iso: string, tz: string): string {
  const p = zonedParts(tz, new Date(iso));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

export function formatTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(
    new Date(iso),
  );
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = {}): string {
  // `date` is a plain YYYY-MM-DD; format it as a UTC date so no zone shifts it.
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(new Date(`${date}T00:00:00Z`));
}

/** Friendly due label: "Today · 5:00 PM", "Tomorrow · 9:00 AM", "Overdue · Sep 25". */
export function formatDue(iso: string, tz: string, now: Date = new Date()): string {
  const due = new Date(iso);
  const today = todayInTz(tz, now);
  const dueDay = todayInTz(tz, due);
  const time = formatTime(iso, tz);
  if (due.getTime() < now.getTime()) {
    return dueDay === today ? `Overdue · ${time}` : `Overdue · ${formatDate(dueDay, { weekday: undefined })}`;
  }
  const diff = daysBetween(today, dueDay);
  if (diff === 0) return `Today · ${time}`;
  if (diff === 1) return `Tomorrow · ${time}`;
  if (diff < 7) return `${formatDate(dueDay, { weekday: "long", month: undefined, day: undefined })} · ${time}`;
  return `${formatDate(dueDay)} · ${time}`;
}

export type DayPart = "morning" | "afternoon" | "evening" | "night";

export function dayPart(tz: string, at: Date = new Date()): DayPart {
  const h = localHour(tz, at);
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

export function relativeFromNow(iso: string, now: Date = new Date()): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [86400000 * 365, "year"],
    [86400000 * 30, "month"],
    [86400000, "day"],
    [3600000, "hour"],
    [60000, "minute"],
  ];
  for (const [ms, unit] of units) {
    if (abs >= ms) {
      const n = Math.floor(abs / ms);
      const label = `${n} ${unit}${n === 1 ? "" : "s"}`;
      return diff > 0 ? `in ${label}` : `${label} ago`;
    }
  }
  return diff > 0 ? "in a moment" : "just now";
}

/** Request-time helpers (kept out of component bodies for the React purity lint). */
export function isPast(iso: string, now: Date = new Date()): boolean {
  return Date.parse(iso) < now.getTime();
}

export function isoDaysAgo(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() - days * 86400000).toISOString();
}
