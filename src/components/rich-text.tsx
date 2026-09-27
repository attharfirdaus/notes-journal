import { Fragment } from "react";
import { parseBlocks, type Inline } from "@/lib/markdown";

function Inlines({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((n, i) =>
        n.kind === "bold" ? (
          <strong key={i}>{n.text}</strong>
        ) : n.kind === "italic" ? (
          <em key={i}>{n.text}</em>
        ) : (
          <Fragment key={i}>{n.text}</Fragment>
        ),
      )}
    </>
  );
}

/** Renders journal text safely: every piece of user content becomes a text node. */
export function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-3 whitespace-pre-wrap leading-relaxed">
      {parseBlocks(text).map((b, i) => {
        if (b.kind === "heading") return <h3 key={i} className="font-display text-xl font-bold"><Inlines inlines={b.inlines} /></h3>;
        if (b.kind === "list")
          return (
            <ul key={i} className="list-disc space-y-1 pl-6">
              {b.items.map((it, j) => (
                <li key={j}><Inlines inlines={it} /></li>
              ))}
            </ul>
          );
        return <p key={i}><Inlines inlines={b.inlines} /></p>;
      })}
    </div>
  );
}
