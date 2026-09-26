// A deliberately tiny formatter for journal text: **bold**, _italic_ and
// "- " bullet lists. It produces an AST (never HTML strings), so user text can
// only ever be rendered as text nodes.

export type Inline = { kind: "text" | "bold" | "italic"; text: string };
export type Block =
  | { kind: "paragraph"; inlines: Inline[] }
  | { kind: "list"; items: Inline[][] }
  | { kind: "heading"; inlines: Inline[] };

const INLINE_RE = /\*\*(.+?)\*\*|(?<![\w*])_(.+?)_(?!\w)|(?<![\w*])\*(?!\*)(.+?)\*(?!\w)/g;

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of s.matchAll(INLINE_RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ kind: "text", text: s.slice(last, i) });
    if (m[1] !== undefined) out.push({ kind: "bold", text: m[1] });
    else out.push({ kind: "italic", text: (m[2] ?? m[3]) as string });
    last = i + m[0].length;
  }
  if (last < s.length) out.push({ kind: "text", text: s.slice(last) });
  return out;
}

export function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: Inline[][] | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ kind: "paragraph", inlines: parseInline(para.join("\n")) });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push({ kind: "list", items: list });
    list = null;
  };

  for (const line of src.replace(/\r\n?/g, "\n").split("\n")) {
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const heading = /^#{1,3}\s+(.*)$/.exec(line);
    if (bullet) {
      flushPara();
      (list ??= []).push(parseInline(bullet[1]));
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push({ kind: "heading", inlines: parseInline(heading[1]) });
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}

export function plainSnippet(src: string, max = 140): string {
  const flat = src
    .replace(/\*\*|__|[*_#]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}
