import { describe, expect, it } from "vitest";
import { parseBlocks, parseInline, plainSnippet } from "../markdown";

describe("markdown-lite", () => {
  it("parses inline styles", () => {
    expect(parseInline("a **b** _c_ *d*")).toEqual([
      { kind: "text", text: "a " }, { kind: "bold", text: "b" }, { kind: "text", text: " " },
      { kind: "italic", text: "c" }, { kind: "text", text: " " }, { kind: "italic", text: "d" },
    ]);
  });

  it("leaves snake_case alone", () => {
    expect(parseInline("my_var_name")).toEqual([{ kind: "text", text: "my_var_name" }]);
  });

  it("keeps HTML as plain text", () => {
    const b = parseBlocks("<img src=x onerror=alert(1)>");
    expect(b).toEqual([{ kind: "paragraph", inlines: [{ kind: "text", text: "<img src=x onerror=alert(1)>" }] }]);
  });

  it("parses lists, headings and paragraphs", () => {
    const b = parseBlocks("# Today\nhello\n\n- one\n- **two**\nafter");
    expect(b.map((x) => x.kind)).toEqual(["heading", "paragraph", "list", "paragraph"]);
  });

  it("makes snippets", () => {
    expect(plainSnippet("**Hi** there\n- a\n- b", 100)).toBe("Hi there a b");
    expect(plainSnippet("x".repeat(200), 10)).toHaveLength(10);
  });
});
