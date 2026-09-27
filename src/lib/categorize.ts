// Rule-based category detection. Kept behind a tiny interface so it can be
// swapped for an LLM classifier later without touching the UI.

export type CategoryLike = { id: string; name: string; keywords: string[] };

export type CategorySuggestion = { id: string; name: string; score: number };

export type CategorizeInput = { title: string; body?: string };

export type CategorizeOptions = { threshold?: number; max?: number };

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenMatches(token: string, kw: string): boolean {
  if (token === kw) return true;
  if (token === `${kw}s` || token === `${kw}es` || `${token}s` === kw) return true;
  // Light stemming for longer words: "cleaning" ~ "clean", "groceries" ~ "grocery".
  if (kw.length >= 4 && (token.startsWith(kw) && token.length - kw.length <= 3)) return true;
  if (kw.endsWith("y") && token === `${kw.slice(0, -1)}ies`) return true;
  return false;
}

function scoreText(text: string, tokens: string[], keywords: string[]): number {
  let score = 0;
  const padded = ` ${text} `;
  for (const raw of keywords) {
    const kw = normalize(raw);
    if (!kw) continue;
    if (kw.includes(" ")) {
      if (padded.includes(` ${kw} `)) score += 2;
    } else if (tokens.some((t) => tokenMatches(t, kw))) {
      score += 1;
    }
  }
  return score;
}

/**
 * Score every category against the note text. The title counts double, the
 * category's own name counts as a strong keyword.
 */
export function categorize(
  input: CategorizeInput,
  categories: CategoryLike[],
  { threshold = 1, max = 2 }: CategorizeOptions = {},
): CategorySuggestion[] {
  const title = normalize(input.title);
  const body = normalize(input.body ?? "");
  const titleTokens = title ? title.split(" ") : [];
  const bodyTokens = body ? body.split(" ") : [];
  if (!titleTokens.length && !bodyTokens.length) return [];

  const scored = categories.map((c) => {
    const keywords = [...c.keywords, c.name];
    const score =
      2 * scoreText(title, titleTokens, keywords) + scoreText(body, bodyTokens, keywords);
    return { id: c.id, name: c.name, score };
  });

  const ranked = scored
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  // Runner-ups only tag along when they're a comparably strong match.
  const top = ranked[0]?.score ?? 0;
  return ranked.filter((s) => s.score * 2 >= top).slice(0, max);
}
