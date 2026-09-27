import { describe, expect, it } from "vitest";
import { categorize, normalize } from "../categorize";

const cats = [
  { id: "shop", name: "Shopping", keywords: ["buy", "grocery", "milk", "eggs", "belanja", "sabun"] },
  { id: "study", name: "Study", keywords: ["exam", "homework", "thesis", "tugas kuliah", "ujian"] },
  { id: "work", name: "Work", keywords: ["meeting", "client", "report"] },
  { id: "health", name: "Health", keywords: ["gym", "vitamin", "doctor"] },
];

describe("categorize", () => {
  it("normalizes text", () => {
    expect(normalize("Café — Grocery-List!")).toBe("cafe grocery list");
  });

  it("detects from the title", () => {
    expect(categorize({ title: "Groceries for the week" }, cats)[0]?.id).toBe("shop");
  });

  it("detects from items and Indonesian keywords", () => {
    expect(categorize({ title: "Minggu ini", body: "belanja sabun" }, cats)[0]?.id).toBe("shop");
    expect(categorize({ title: "Tugas kuliah minggu depan" }, cats)[0]?.id).toBe("study");
  });

  it("matches the category name itself", () => {
    expect(categorize({ title: "health stuff" }, cats)[0]?.id).toBe("health");
  });

  it("returns multiple strong categories", () => {
    const r = categorize({ title: "client meeting then gym" }, cats);
    expect(r.map((x) => x.id)).toEqual(["work", "health"]);
  });

  it("drops weak runner-ups", () => {
    const r = categorize({ title: "exam thesis homework", body: "buy" }, cats);
    expect(r.map((x) => x.id)).toEqual(["study"]);
  });

  it("returns nothing for unrelated text", () => {
    expect(categorize({ title: "zzz" }, cats)).toEqual([]);
  });
});
