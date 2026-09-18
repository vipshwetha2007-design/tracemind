/**
 * POST /api/knowledge/save
 *
 * Step 2 of the knowledge-ingestion flow: the human-in-the-loop save. Takes
 * the extraction the user has reviewed (and approved, possibly after
 * editing it in the UI) from POST /api/knowledge/analyze, and persists it:
 *
 *   - the KnowledgeSource itself (always)
 *   - any newly-mentioned People (upserted by name)
 *   - each detected Decision, with its DecisionParticipants and Evidence
 *   - TimelineEvents, so the new activity shows up on the Timeline page
 *     and becomes part of each decision's trail
 *
 * All of this happens in a single database transaction — either everything
 * is saved, or nothing is.
 *
 * Note: extraction.actionItems are shown in the AI Extraction Review for
 * context but are NOT persisted — there's no ActionItem table in this
 * MVP's schema (see ARCHITECTURE.md for why, and how you'd add one).
 *
 * Frontend caller: src/app/knowledge/add/page.tsx
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ExtractionSchema } from "@/lib/gemini";

const SaveRequestSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["Meeting", "Document"]),
  date: z.string(),
  fileName: z.string().nullable().optional(),
  content: z.string().min(1),
  extraction: ExtractionSchema.nullable(),
});

function parseDateOrFallback(input: string | undefined, fallback: Date): Date {
  if (!input) return fallback;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = SaveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Request did not match the expected shape.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, type, date, fileName, content, extraction } = parsed.data;
  const sourceDate = parseDateOrFallback(date, new Date());

  try {
    const result = await prisma.$transaction(async (tx) => {
      const knowledgeSource = await tx.knowledgeSource.create({
        data: { title, type, content, fileName: fileName ?? null, createdAt: sourceDate },
      });

      if (!extraction) {
        await tx.timelineEvent.create({
          data: {
            title: `${type} added: ${title}`,
            type: type === "Meeting" ? "meeting" : "document",
            description: "Added to institutional memory.",
            eventDate: sourceDate,
            knowledgeSourceId: knowledgeSource.id,
          },
        });
        return { knowledgeSourceId: knowledgeSource.id, decisionIds: [] as string[] };
      }

      // Resolve (or create) a Person for every name mentioned, across both
      // the top-level "people" list and each decision's participant list.
      const nameToPersonId = new Map<string, string>();
      const roleByName = new Map<string, string>();
      for (const person of extraction.people) {
        roleByName.set(person.name.trim().toLowerCase(), person.role || "Team Member");
      }

      async function resolvePersonId(name: string): Promise<string> {
        const trimmed = name.trim();
        const key = trimmed.toLowerCase();
        const cached = nameToPersonId.get(key);
        if (cached) return cached;

        const existing = await tx.person.findFirst({ where: { name: trimmed } });
        if (existing) {
          nameToPersonId.set(key, existing.id);
          return existing.id;
        }

        const created = await tx.person.create({
          data: {
            name: trimmed,
            role: roleByName.get(key) || "Team Member",
            department: "Unassigned",
          },
        });
        nameToPersonId.set(key, created.id);
        return created.id;
      }

      for (const person of extraction.people) {
        await resolvePersonId(person.name);
      }

      const decisionIds: string[] = [];

      for (const detected of extraction.decisions) {
        const decisionDate = parseDateOrFallback(detected.date, sourceDate);

        const decision = await tx.decision.create({
          data: {
            title: detected.title,
            status: detected.status,
            summary: detected.summary || detected.title,
            reason: detected.reason,
            outcome: null,
            decisionDate,
          },
        });
        decisionIds.push(decision.id);

        const participantNames = detected.participants.filter((n) => n.trim().length > 0);
        for (let i = 0; i < participantNames.length; i++) {
          const personId = await resolvePersonId(participantNames[i]);
          await tx.decisionParticipant.create({
            data: {
              decisionId: decision.id,
              personId,
              role: i === 0 ? "Owner" : "Participant",
            },
          });
        }

        await tx.evidence.create({
          data: {
            decisionId: decision.id,
            knowledgeSourceId: knowledgeSource.id,
            excerpt: detected.evidenceExcerpt || detected.summary || detected.title,
          },
        });

        await tx.timelineEvent.create({
          data: {
            title: `Decision: ${detected.title}`,
            type: "decision",
            description: detected.reason || detected.summary,
            eventDate: decisionDate,
            decisionId: decision.id,
            knowledgeSourceId: knowledgeSource.id,
          },
        });
      }

      await tx.timelineEvent.create({
        data: {
          title: `${type} added: ${title}`,
          type: type === "Meeting" ? "meeting" : "document",
          description: extraction.summary || "Added to institutional memory.",
          eventDate: sourceDate,
          knowledgeSourceId: knowledgeSource.id,
        },
      });

      return { knowledgeSourceId: knowledgeSource.id, decisionIds };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while saving to institutional memory." },
      { status: 500 }
    );
  }
}
