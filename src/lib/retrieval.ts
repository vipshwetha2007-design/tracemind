/**
 * Tiny keyword-based retrieval helpers shared by /api/ask and /api/search.
 *
 * TraceMind's MVP deliberately does not use a vector database or embeddings
 * — the dataset is small (a handful of decisions/people/sources), so both
 * endpoints simply load everything and rank it in plain JavaScript. This
 * keeps the retrieval step easy to read and explain: "split the question
 * into words, count how many appear in each record, take the highest
 * scores." A later stage could swap this for embeddings + a vector index
 * without changing anything above this file.
 */

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "of", "to", "in", "on", "for", "and", "or", "but", "with", "by", "at",
  "this", "that", "these", "those", "it", "its", "as", "did", "do", "does",
  "who", "what", "when", "where", "why", "how", "which", "we", "our",
]);

/** Lowercases and splits text into meaningful words, dropping stopwords and very short tokens. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/** Counts how many of `tokens` appear in `text` (case-insensitive). */
export function scoreText(text: string, tokens: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (lower.includes(token)) score += 1;
  }
  return score;
}

/** Ranks `items` by a scoring function against `tokens`, keeping only positive-score matches. */
export function rankByTokens<T>(
  items: T[],
  tokens: string[],
  getText: (item: T) => string,
  limit: number
): T[] {
  return items
    .map((item) => ({ item, score: scoreText(getText(item), tokens) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}
