/**
 * GET /api/search?q=...
 *
 * Powers the command-style search field in the top header. Searches
 * decisions, people, and knowledge sources and returns a small, grouped set
 * of matches for each. Uses the same simple keyword-ranking approach as
 * /api/ask (src/lib/retrieval.ts) rather than a dedicated search index.
 *
 * Frontend caller: src/components/layout/Header.tsx
 */

import { NextResponse } from "next/server";
import { getRetrievalDataset } from "@/lib/queries";
import { rankByTokens, tokenize } from "@/lib/retrieval";
import type { SearchResults } from "@/types";

const RESULTS_PER_GROUP = 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  const empty: SearchResults = { decisions: [], people: [], knowledge: [] };
  if (!query) {
    return NextResponse.json(empty);
  }

  const tokens = tokenize(query);
  // Very short queries (e.g. "AI") can tokenize to nothing once stopwords
  // and the length filter are applied — fall back to the raw query itself.
  const effectiveTokens = tokens.length > 0 ? tokens : [query.toLowerCase()];

  const { decisions, people, knowledge } = await getRetrievalDataset();

  const matchedDecisions = rankByTokens(
    decisions,
    effectiveTokens,
    (d) => `${d.title} ${d.reason}`,
    RESULTS_PER_GROUP
  );
  const matchedPeople = rankByTokens(
    people,
    effectiveTokens,
    (p) => `${p.name} ${p.role} ${p.department}`,
    RESULTS_PER_GROUP
  );
  const matchedKnowledge = rankByTokens(
    knowledge,
    effectiveTokens,
    (k) => k.title,
    RESULTS_PER_GROUP
  );

  const results: SearchResults = {
    decisions: matchedDecisions.map((d) => ({ id: d.id, title: d.title, status: d.status })),
    people: matchedPeople.map((p) => ({ id: p.id, name: p.name, role: p.role })),
    knowledge: matchedKnowledge.map((k) => ({ id: k.id, title: k.title, type: k.type })),
  };

  return NextResponse.json(results);
}
