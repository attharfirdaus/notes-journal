import { describe, expect, it } from "vitest";
import { planQuickAdd } from "../quick-add";

const tz = "Asia/Jakarta";
const now = new Date("2026-09-26T03:00:00Z");

describe("planQuickAdd", () => {
  it("builds a checklist from 'Title: a, b, c'", () => {
    const p = planQuickAdd("groceries: milk, eggs, bread", tz, now)!;
    expect(p.title).toBe("Groceries");
    expect(p.type).toBe("checklist");
    expect(p.items.map((i) => i.text)).toEqual(["milk", "eggs", "bread"]);
  });

  it("does not split on the colon of a clock time or a link", () => {
    const p = planQuickAdd("dinner tomorrow at 7:30pm", tz, now)!;
    expect(p.type).toBe("schedule");
    expect(p.title).toBe("Dinner");
    expect(p.items[0].due_at).toBe("2026-09-27T12:30:00.000Z");
    expect(planQuickAdd("read https://example.com/a", tz, now)!.type).toBe("free");
    expect(planQuickAdd("party at 7:30: cake, balloons", tz, now)!.title).toBe("Party at 7:30");
  });

  it("builds a checklist from a bare comma list", () => {
    const p = planQuickAdd("milk, eggs", tz, now)!;
    expect(p.type).toBe("checklist");
    expect(p.items).toHaveLength(2);
  });

  it("builds a task with a deadline", () => {
    const p = planQuickAdd("submit report friday 5pm", tz, now)!;
    expect(p.type).toBe("tasks");
    expect(p.title).toBe("Submit report");
    expect(p.items[0].due_at).toBe("2026-10-02T10:00:00.000Z");
  });

  it("builds a schedule for events", () => {
    expect(planQuickAdd("team meeting tomorrow at 10", tz, now)!.type).toBe("schedule");
  });

  it("treats a call as a task, not an event", () => {
    expect(planQuickAdd("call dentist tomorrow 3pm", tz, now)!.type).toBe("tasks");
  });

  it("picks up repeats", () => {
    const monthly = planQuickAdd("pay rent every month", tz, now)!;
    expect(monthly.title).toBe("Pay rent");
    expect(monthly.items[0]).toEqual({ text: "Pay rent", due_at: "2026-09-27T02:00:00.000Z", recurrence: "monthly" });
    const weekly = planQuickAdd("gym every friday 5pm", tz, now)!;
    expect(weekly.title).toBe("Gym");
    expect(weekly.items[0].recurrence).toBe("weekly");
    expect(weekly.items[0].due_at).toBe("2026-10-02T10:00:00.000Z");
    expect(planQuickAdd("minum obat setiap hari", tz, now)!.recurrence).toBe("daily");
    expect(planQuickAdd("daily standup notes", tz, now)!.type).toBe("free");
    expect(planQuickAdd("every day", tz, now)!.type).toBe("free");
  });

  it("falls back to a free note", () => {
    const p = planQuickAdd("ideas for my blog", tz, now)!;
    expect(p.type).toBe("free");
    expect(p.title).toBe("Ideas for my blog");
    expect(planQuickAdd("   ", tz, now)).toBeNull();
  });
});
