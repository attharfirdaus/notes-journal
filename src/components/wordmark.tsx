import clsx from "clsx";

/**
 * The name set in the display face. There is no drawn logo yet (see DESIGN.md),
 * so the wordmark is the logo.
 */
export function Wordmark({ className }: { className?: string }) {
  return <span className={clsx("font-display font-bold italic tracking-tight", className)}>Keepsake</span>;
}
