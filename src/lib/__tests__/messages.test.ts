import { describe, expect, it } from "vitest";
import { MESSAGES, pickMessage, renderMessage, type MessageContext } from "../messages";

const base: MessageContext = {
  dayPart: "morning", lastMood: 3, streak: 0, overdue: 0, tasksDoneToday: 0,
  wroteToday: false, isNew: false, focusToday: 0,
};

describe("messages", () => {
  it("has unique ids and plenty of variety", () => {
    expect(new Set(MESSAGES.map((m) => m.id)).size).toBe(MESSAGES.length);
    expect(MESSAGES.length).toBeGreaterThan(100);
  });

  it("never picks a message whose context doesn't apply", () => {
    for (let i = 0; i < 300; i++) {
      const m = pickMessage(base);
      expect(m.tags.some((t) => ["night", "evening", "afternoon", "streak", "overdue", "low", "high", "journaled", "new", "focus", "productive"].includes(t))).toBe(false);
    }
  });

  it("favors supportive messages on low-mood days", () => {
    let low = 0;
    for (let i = 0; i < 400; i++) if (pickMessage({ ...base, lastMood: 1 }).tags.includes("low")) low++;
    expect(low).toBeGreaterThan(150);
  });

  it("avoids recently shown messages", () => {
    const ctx = { ...base, isNew: true };
    const recent = MESSAGES.filter((m) => m.tags.includes("any")).map((m) => m.id);
    for (let i = 0; i < 50; i++) expect(recent).not.toContain(pickMessage(ctx, recent).id);
  });

  it("fills placeholders", () => {
    const m = { id: "x", tags: ["any" as const], text: "{name} & {pet}: {streak}" };
    expect(renderMessage(m, { name: "Ana", pet: "Pip", streak: 4 })).toBe("Ana & Pip: 4");
    expect(renderMessage(m, { name: "", pet: "Pip", streak: 4 })).toBe("friend & Pip: 4");
  });
});
