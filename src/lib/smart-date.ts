import * as chrono from "chrono-node";
import { tzOffsetMinutes, zonedToIso } from "./time";

export type DateSuggestion = {
  /** UTC ISO timestamp. */
  iso: string;
  /** The phrase chrono matched, e.g. "tomorrow 5pm". */
  matched: string;
  hasTime: boolean;
  /** Input with the date phrase (and a dangling "by/on/at") removed. */
  cleaned: string;
};

const DAY_PART_WORDS = /\b(tonight|morning|noon|afternoon|evening|night|midnight)\b/i;
const DANGLING = /\s+(by|on|at|due|before|until|for)$/i;
const DEFAULT_HOUR = 9;

/**
 * Detect a natural-language date in `text`, interpreted in time zone `tz`.
 * Dates without an explicit time default to 09:00 local.
 */
export function detectDate(text: string, tz: string, now: Date = new Date()): DateSuggestion | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const results = chrono.parse(
    trimmed,
    { instant: now, timezone: tzOffsetMinutes(tz, now) },
    { forwardDate: true },
  );
  const r = results[0];
  if (!r) return null;

  const hasTime = r.start.isCertain("hour");
  let iso: string;
  if (hasTime || DAY_PART_WORDS.test(r.text)) {
    iso = r.start.date().toISOString();
  } else {
    iso = zonedToIso(
      tz,
      r.start.get("year") ?? 0,
      r.start.get("month") ?? 1,
      r.start.get("day") ?? 1,
      DEFAULT_HOUR,
      0,
    );
  }

  const before = trimmed.slice(0, r.index).trimEnd().replace(DANGLING, "");
  const after = trimmed.slice(r.index + r.text.length);
  const cleaned = `${before} ${after}`
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/^[,.;:\s-]+|[,;:\s-]+$/g, "")
    .trim();

  return { iso, matched: r.text, hasTime: hasTime || DAY_PART_WORDS.test(r.text), cleaned };
}
