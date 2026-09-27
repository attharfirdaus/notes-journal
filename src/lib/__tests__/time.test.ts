import { describe, expect, it } from "vitest";
import {
  addDays, daysBetween, dayPart, formatDue, isoToZonedInput, todayInTz, tzOffsetMinutes, zonedInputToIso,
} from "../time";

describe("time", () => {
  const at = new Date("2026-09-26T20:30:00Z");

  it("computes offsets", () => {
    expect(tzOffsetMinutes("Asia/Jakarta", at)).toBe(420);
    expect(tzOffsetMinutes("UTC", at)).toBe(0);
    expect(tzOffsetMinutes("America/New_York", at)).toBe(-240);
  });

  it("gets the local date", () => {
    expect(todayInTz("Asia/Jakarta", at)).toBe("2026-09-27");
    expect(todayInTz("America/New_York", at)).toBe("2026-09-26");
  });

  it("round-trips datetime-local values", () => {
    const iso = zonedInputToIso("2026-09-27T17:00", "Asia/Jakarta");
    expect(iso).toBe("2026-09-27T10:00:00.000Z");
    expect(isoToZonedInput(iso!, "Asia/Jakarta")).toBe("2026-09-27T17:00");
  });

  it("handles DST", () => {
    // New York switches to EST on 2026-11-01.
    expect(zonedInputToIso("2026-11-02T09:00", "America/New_York")).toBe("2026-11-02T14:00:00.000Z");
    expect(zonedInputToIso("2026-10-30T09:00", "America/New_York")).toBe("2026-10-30T13:00:00.000Z");
  });

  it("does date math", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-09-01", "2026-09-26")).toBe(25);
  });

  it("labels due dates", () => {
    const tz = "Asia/Jakarta";
    const now = new Date("2026-09-26T03:00:00Z"); // 10:00 WIB
    expect(formatDue("2026-09-26T10:00:00Z", tz, now)).toBe("Today · 5:00 PM");
    expect(formatDue("2026-09-27T02:00:00Z", tz, now)).toBe("Tomorrow · 9:00 AM");
    expect(formatDue("2026-09-26T01:00:00Z", tz, now)).toBe("Overdue · 8:00 AM");
    expect(formatDue("2026-09-20T01:00:00Z", tz, now)).toBe("Overdue · Sep 20");
    expect(formatDue("2026-09-29T02:00:00Z", tz, now)).toBe("Tuesday · 9:00 AM");
  });

  it("knows the part of the day", () => {
    expect(dayPart("Asia/Jakarta", new Date("2026-09-26T01:00:00Z"))).toBe("morning");
    expect(dayPart("Asia/Jakarta", new Date("2026-09-26T16:00:00Z"))).toBe("night");
  });
});
