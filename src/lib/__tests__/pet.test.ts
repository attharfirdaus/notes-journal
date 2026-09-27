import { describe, expect, it } from "vitest";
import { petMood, petStage } from "../pet";

const day = { today: "2026-09-26", last_active_day: "2026-09-26", wrote_today: false, tasks_done_today: 0, overdue: 0, focus_today: 0 };

describe("pet", () => {
  it("evolves with active days", () => {
    expect(petStage(0).stage).toBe("acorn");
    expect(petStage(1).stage).toBe("kit");
    expect(petStage(12).stage).toBe("scout");
    expect(petStage(12).daysToNext).toBe(18);
    expect(petStage(0).daysToNext).toBe(1);
    expect(petStage(40).stage).toBe("keeper");
    expect(petStage(40).next).toBeNull();
  });

  it("reflects today's activity", () => {
    expect(petMood({ ...day, last_active_day: null })).toBe("neutral");
    expect(petMood({ ...day, wrote_today: true, tasks_done_today: 3, focus_today: 25 })).toBe("ecstatic");
    expect(petMood({ ...day, wrote_today: true })).toBe("happy");
    expect(petMood({ ...day, overdue: 3 })).toBe("sad");
    expect(petMood({ ...day, last_active_day: "2026-09-20" })).toBe("sleepy");
    expect(petMood({ ...day, last_active_day: "2026-09-25" })).toBe("sleepy");
  });
});
