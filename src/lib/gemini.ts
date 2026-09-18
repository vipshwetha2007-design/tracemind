/**
 * The ONLY place in the app that talks to Google Gemini.
 *
 * Every other file — API routes, pages, components — goes through the two
 * functions exported here (`extractKnowledge`, `answerQuestion`) instead of
 * importing the Gemini SDK directly. That keeps the prompt text, the model
 * name, and the JSON-parsing/validation logic in one auditable place, and
 * means the API key is only ever read on the server, inside this file.
 *
 * Flow: UI -> API route -> this file -> Gemini API. The frontend never
 * calls Gemini directly.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/** A typed error so API routes can turn AI failures into clear HTTP responses. */
export class AiServiceError extends Error {
  code: "missing_api_key" | "request_failed" | "invalid_output";

  constructor(code: AiServiceError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "AiServiceError";
  }
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiServiceError(
      "missing_api_key",
      "GEMINI_API_KEY is not set. Add it to your .env file to enable AI features."
    );
  }
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });
}

/** Wraps a Gemini call so network/API failures surface as AiServiceError, not a raw throw. */
async function generateJson(prompt: string): Promise<string> {
  const model = getModel();
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    throw new AiServiceError(
      "request_failed",
      error instanceof Error
        ? `Gemini request failed: ${error.message}`
        : "Gemini request failed."
    );
  }
}

// ---------------------------------------------------------------------------
// Knowledge extraction — turns raw meeting notes / document text into
// structured institutional knowledge for a human to review before saving.
// ---------------------------------------------------------------------------

export const ExtractionSchema = z.object({
  summary: z.string().default(""),
  people: z
    .array(
      z.object({
        name: z.string(),
        role: z.string().optional().default(""),
      })
    )
    .default([]),
  decisions: z
    .array(
      z.object({
        title: z.string(),
        summary: z.string().default(""),
        reason: z.string().default(""),
        status: z
          .enum(["Approved", "Pending", "Deferred", "Rejected"])
          .default("Pending"),
        date: z.string().optional().default(""),
        participants: z.array(z.string()).default([]),
        evidenceExcerpt: z.string().optional().default(""),
      })
    )
    .default([]),
  actionItems: z
    .array(
      z.object({
        task: z.string(),
        owner: z.string().optional().default(""),
        dueDate: z.string().optional().default(""),
      })
    )
    .default([]),
});

export type ExtractionResult = z.infer<typeof ExtractionSchema>;

const EXTRACTION_PROMPT = `You are an institutional-knowledge analyst for TraceMind, a platform that \
traces WHY organizational decisions were made.

Read the meeting notes or document text below and extract structured information as JSON, \
matching EXACTLY this shape:

{
  "summary": "a 2-3 sentence summary of the content",
  "people": [{ "name": "string", "role": "string (best guess, or empty string if unknown)" }],
  "decisions": [
    {
      "title": "short decision title",
      "summary": "what was decided",
      "reason": "why it was decided",
      "status": "Approved" | "Pending" | "Deferred" | "Rejected",
      "date": "YYYY-MM-DD if mentioned, else empty string",
      "participants": ["names of people involved in this specific decision"],
      "evidenceExcerpt": "a short direct excerpt from the text that supports this decision"
    }
  ],
  "actionItems": [
    { "task": "string", "owner": "string, or empty string if unassigned", "dueDate": "YYYY-MM-DD or empty string" }
  ]
}

CRITICAL RULES:
- Only extract decisions that are explicitly and clearly present in the text. If the text does not \
describe any actual decision being made, return an empty "decisions" array. Do NOT invent a decision \
that is not there.
- Only include people who are actually named in the text.
- "status" must be exactly one of the four listed values.
- Respond with ONLY the JSON object. No markdown, no commentary.

TEXT TO ANALYZE:
"""
{{CONTENT}}
"""`;

/**
 * Analyzes raw meeting notes / document text and returns structured
 * institutional knowledge (summary, people, decisions, action items).
 *
 * Never trusts the raw model output: the JSON is parsed and validated
 * against ExtractionSchema before being returned. If Gemini returns
 * something that isn't valid JSON matching the schema, this throws
 * AiServiceError("invalid_output") rather than silently passing through
 * malformed data.
 */
export async function extractKnowledge(text: string): Promise<ExtractionResult> {
  const prompt = EXTRACTION_PROMPT.replace("{{CONTENT}}", text.slice(0, 20000));
  const raw = await generateJson(prompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AiServiceError(
      "invalid_output",
      "The AI did not return valid JSON. Please try again."
    );
  }

  const result = ExtractionSchema.safeParse(parsed);
  if (!result.success) {
    throw new AiServiceError(
      "invalid_output",
      "The AI's response did not match the expected structure."
    );
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// Ask TraceMind — answers a question using ONLY institutional context
// retrieved from the database (see src/app/api/ask/route.ts for retrieval).
// ---------------------------------------------------------------------------

const AnswerSchema = z.object({
  answer: z.string(),
  hasSufficientEvidence: z.boolean().default(true),
});

export type AnswerResult = z.infer<typeof AnswerSchema>;

const ANSWER_PROMPT = `You are TraceMind, an institutional-memory assistant. Answer the question \
using ONLY the institutional context provided below — do not use any outside knowledge, and do not \
invent people, decisions, or events that are not in the context.

Respond with ONLY a JSON object of this exact shape:
{ "answer": "your answer in 2-4 sentences", "hasSufficientEvidence": true | false }

If the provided context does not contain enough information to answer the question, set \
"hasSufficientEvidence" to false and let "answer" explain that the institutional memory does not \
currently contain enough evidence to answer this — do not guess or fabricate an answer.

INSTITUTIONAL CONTEXT:
"""
{{CONTEXT}}
"""

QUESTION: {{QUESTION}}`;

/**
 * Answers a question strictly from the given institutional context (built
 * by searching the database — see src/app/api/ask/route.ts). Gemini is
 * explicitly instructed not to use outside knowledge and to say so when the
 * context is insufficient, rather than invent an answer.
 */
export async function answerQuestion(
  question: string,
  context: string
): Promise<AnswerResult> {
  const prompt = ANSWER_PROMPT.replace("{{CONTEXT}}", context.slice(0, 20000)).replace(
    "{{QUESTION}}",
    question
  );
  const raw = await generateJson(prompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AiServiceError(
      "invalid_output",
      "The AI did not return valid JSON. Please try again."
    );
  }

  const result = AnswerSchema.safeParse(parsed);
  if (!result.success) {
    throw new AiServiceError(
      "invalid_output",
      "The AI's response did not match the expected structure."
    );
  }

  return result.data;
}
