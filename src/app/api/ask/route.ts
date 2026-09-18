/**
 * POST /api/ask
 *
 * Powers the "Ask TraceMind" page. Flow:
 *
 *   1. Receive the question.
 *   2. Search decisions/people/knowledge sources already in the database
 *      for records relevant to the question (src/lib/retrieval.ts).
 *   3. Build a concise text context from just those matching records.
 *   4. Send ONLY that context + the question to Gemini, instructed to
 *      answer strictly from the given context.
 *   5. Return the answer, along with which sources and decisions it's
 *      based on, so the UI can show "Sources used" and "Related Decision".
 *
 * If nothing relevant is found, no context is sent and Gemini is expected
 * to say the institutional memory doesn't contain enough evidence — see
 * the prompt in src/lib/gemini.ts.
 *
 * Frontend caller: src/app/ask/page.tsx
 */

import { NextResponse } from "next/server";
import { AiServiceError, answerQuestion } from "@/lib/gemini";
import { getAllDecisions, getAllPeople, getKnowledgeSourceTexts } from "@/lib/queries";
import { rankByTokens, tokenize } from "@/lib/retrieval";
import type { AskResponse } from "@/types";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question =
    typeof body === "object" && body !== null && "question" in body
      ? String((body as { question: unknown }).question ?? "").trim()
      : "";

  if (!question) {
    return NextResponse.json({ error: "Please ask a question." }, { status: 400 });
  }

  const tokens = tokenize(question);
  const [decisions, people, knowledgeSources] = await Promise.all([
    getAllDecisions(),
    getAllPeople(),
    getKnowledgeSourceTexts(),
  ]);

  const knowledgeById = new Map(knowledgeSources.map((k) => [k.id, k]));

  const matchedDecisions = rankByTokens(
    decisions,
    tokens,
    (d) =>
      `${d.title} ${d.whatDescription} ${d.whyDescription} ${d.ownerName ?? ""} ${d.people
        .map((p) => p.name)
        .join(" ")}`,
    5
  );
  const matchedPeople = rankByTokens(people, tokens, (p) => `${p.name} ${p.role} ${p.department}`, 3);
  const matchedKnowledge = rankByTokens(
    knowledgeSources,
    tokens,
    (k) => `${k.title} ${k.content}`,
    3
  );

  const contextSections: string[] = [];

  if (matchedDecisions.length > 0) {
    contextSections.push(
      "DECISIONS:\n" +
        matchedDecisions
          .map((d) => {
            const evidenceTitles = d.evidenceIds
              .map((id) => knowledgeById.get(id)?.title)
              .filter(Boolean)
              .join(", ");
            return (
              `- "${d.title}" (status: ${d.status}, date: ${d.date.slice(0, 10)})\n` +
              `  What: ${d.whatDescription}\n` +
              `  Why: ${d.whyDescription}\n` +
              `  Owner: ${d.ownerName ?? "unknown"}. Participants: ${d.people.map((p) => p.name).join(", ") || "none listed"}.\n` +
              `  Evidence sources: ${evidenceTitles || "none"}.`
            );
          })
          .join("\n")
    );
  }

  if (matchedPeople.length > 0) {
    contextSections.push(
      "PEOPLE:\n" +
        matchedPeople
          .map((p) => `- ${p.name}, ${p.role}, ${p.department}. Involved in ${p.decisionIds.length} decision(s).`)
          .join("\n")
    );
  }

  if (matchedKnowledge.length > 0) {
    contextSections.push(
      "KNOWLEDGE SOURCES:\n" +
        matchedKnowledge
          .map((k) => `- "${k.title}" (${k.type}): ${k.content.slice(0, 500)}`)
          .join("\n")
    );
  }

  const context = contextSections.join("\n\n");

  try {
    const result = context
      ? await answerQuestion(question, context)
      : {
          answer:
            "The institutional memory does not currently contain enough evidence to answer this question.",
          hasSufficientEvidence: false,
        };

    const sourceIds = new Set<string>();
    for (const d of matchedDecisions) {
      for (const id of d.evidenceIds) sourceIds.add(id);
    }
    for (const k of matchedKnowledge) sourceIds.add(k.id);

    const response: AskResponse = {
      answer: result.answer,
      hasSufficientEvidence: result.hasSufficientEvidence,
      sources: Array.from(sourceIds)
        .map((id) => knowledgeById.get(id))
        .filter((k): k is NonNullable<typeof k> => Boolean(k))
        .slice(0, 5)
        .map((k) => ({ id: k.id, title: k.title, type: k.type as "Document" | "Meeting" })),
      relatedDecisions: matchedDecisions
        .slice(0, 3)
        .map((d) => ({ id: d.id, title: d.title, status: d.status })),
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AiServiceError) {
      const status = error.code === "missing_api_key" ? 503 : 502;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: "Something went wrong answering this question." }, { status: 500 });
  }
}
