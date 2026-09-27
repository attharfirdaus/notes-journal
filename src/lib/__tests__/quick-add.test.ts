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

  it("falls back to a free note", () => {
    const p = planQuickAdd("ideas for my blog", tz, now)!;
    expect(p.type).toBe("free");
    expect(p.title).toBe("Ideas for my blog");
    expect(planQuickAdd("   ", tz, now)).toBeNull();
  });
});
