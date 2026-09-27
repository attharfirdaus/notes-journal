import { describe, expect, it } from "vitest";
import { detectDate } from "../smart-date";

const tz = "Asia/Jakarta";
const now = new Date("2026-09-26T03:00:00Z"); // Sat 10:00 WIB

describe("detectDate", () => {
  it("parses a weekday with time and strips the phrase", () => {
    const d = detectDate("Submit report by Friday 5pm", tz, now)!;
    expect(d.iso).toBe("2026-10-02T10:00:00.000Z");
    expect(d.cleaned).toBe("Submit report");
    expect(d.hasTime).toBe(true);
  });

  it("defaults to 9am when no time is given", () => {
    const d = detectDate("buy milk tomorrow", tz, now)!;
    expect(d.iso).toBe("2026-09-27T02:00:00.000Z");
    expect(d.cleaned).toBe("buy milk");
    expect(d.hasTime).toBe(false);
  });

  it("keeps day-part hints like tonight", () => {
    const d = detectDate("call mom tonight", tz, now)!;
    expect(d.cleaned).toBe("call mom");
    expect(new Date(d.iso).getUTCHours()).toBe(15); // 22:00 WIB
  });

  it("ignores text without dates", () => {
    expect(detectDate("I may go", tz, now)).toBeNull();
    expect(detectDate("2 kg rice", tz, now)).toBeNull();
    expect(detectDate("", tz, now)).toBeNull();
  });
});
