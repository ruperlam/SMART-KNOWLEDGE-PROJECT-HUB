export type PreferenceRule = {
  keyword: string;
  preferredTopicId: string;
  confidence: number;
};

/** Finds the best-matching learned topic for a piece of text (item title,
 * URL, etc.) by checking whether any learned keyword appears as a substring.
 * Picks the highest-confidence match. Returns undefined if nothing matches. */
export function suggestTopicId(
  text: string,
  rules: PreferenceRule[]
): string | undefined {
  const lower = text.toLowerCase();
  const matches = rules.filter((r) => lower.includes(r.keyword.toLowerCase()));
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => b.confidence - a.confidence);
  return matches[0].preferredTopicId;
}

/** Picks a simple primary keyword out of a title to store a new preference
 * rule against (first word longer than 3 chars). */
export function primaryKeyword(text: string): string | undefined {
  const word = text
    .toLowerCase()
    .split(/[\s,._-]+/)
    .find((w) => w.length > 3);
  return word;
}
