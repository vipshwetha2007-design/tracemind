/**
 * TraceMind's data-access layer.
 *
 * Every Server Component page (Overview, Decisions, Knowledge, People,
 * Timeline, and their detail pages) reads data by calling a function from
 * this file — never by importing `prisma` directly. Each function does one
 * Prisma query (occasionally two, when the shape is much simpler that way),
 * then maps the raw rows into the view-model types from src/types/index.ts
 * so components never see a raw database row.
 *
 * This is also the seam for a later stage: if the database or ORM ever
 * changes, only this file needs to change — the pages and components would
 * not need to.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getInitials, formatRelativeTime } from "@/lib/format";
import type {
  Activity,
  ActivityType,
  Decision,
  DecisionDetail,
  DecisionStatus,
  DecisionTrailStep,
  EvidenceItem,
  KnowledgeSource,
  KnowledgeType,
  Person,
  PersonDetail,
  TimelineEvent,
  TimelineEventType,
} from "@/types";

// ---------------------------------------------------------------------------
// Shared include shapes + row mappers
// ---------------------------------------------------------------------------

const decisionListInclude = {
  participants: { include: { person: true } },
  evidence: { select: { knowledgeSourceId: true } },
} satisfies Prisma.DecisionInclude;

type DecisionListRow = Prisma.DecisionGetPayload<{ include: typeof decisionListInclude }>;

function mapDecision(row: DecisionListRow): Decision {
  const owner = row.participants.find((p) => p.role === "Owner");
  return {
    id: row.id,
    title: row.title,
    status: row.status as DecisionStatus,
    date: row.decisionDate.toISOString(),
    ownerId: owner?.personId ?? null,
    ownerName: owner?.person.name ?? null,
    reason: row.reason,
    whatDescription: row.summary,
    whyDescription: row.reason,
    outcome: row.outcome,
    peopleIds: row.participants.map((p) => p.personId),
    people: row.participants.map((p) => ({
      id: p.person.id,
      name: p.person.name,
      initials: getInitials(p.person.name),
    })),
    evidenceIds: row.evidence.map((e) => e.knowledgeSourceId),
  };
}

const knowledgeListInclude = {
  addedBy: true,
  evidence: { select: { decisionId: true } },
} satisfies Prisma.KnowledgeSourceInclude;

type KnowledgeListRow = Prisma.KnowledgeSourceGetPayload<{ include: typeof knowledgeListInclude }>;

function mapKnowledgeSource(row: KnowledgeListRow): KnowledgeSource {
  return {
    id: row.id,
    title: row.title,
    type: row.type as KnowledgeType,
    date: row.createdAt.toISOString(),
    addedById: row.addedById,
    addedByName: row.addedBy?.name ?? null,
    linkedDecisionIds: row.evidence.map((e) => e.decisionId),
  };
}

const personListInclude = {
  participations: { select: { decisionId: true } },
  knowledgeSources: { select: { id: true } },
} satisfies Prisma.PersonInclude;

type PersonListRow = Prisma.PersonGetPayload<{ include: typeof personListInclude }>;

function mapPerson(row: PersonListRow): Person {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    department: row.department,
    initials: getInitials(row.name),
    decisionIds: row.participations.map((p) => p.decisionId),
    knowledgeIds: row.knowledgeSources.map((k) => k.id),
  };
}

/**
 * A lighter Person mapping for when a person is embedded inside another
 * entity (e.g. a decision's owner/participants) and we already have their
 * id/name/role/department from a join, but haven't separately queried
 * their full decision/knowledge counts. Used only where those counts
 * aren't displayed.
 */
function mapPersonBasic(row: { id: string; name: string; role: string; department: string }): Person {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    department: row.department,
    initials: getInitials(row.name),
    decisionIds: [],
    knowledgeIds: [],
  };
}

function byDateDesc<T extends { date: string }>(a: T, b: T): number {
  return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getDashboardStats() {
  const [decisionCount, knowledgeCount, personCount, eventCount] = await Promise.all([
    prisma.decision.count(),
    prisma.knowledgeSource.count(),
    prisma.person.count(),
    prisma.timelineEvent.count(),
  ]);
  return { decisionCount, knowledgeCount, personCount, eventCount };
}

export async function getRecentDecisions(limit: number): Promise<Decision[]> {
  const rows = await prisma.decision.findMany({
    include: decisionListInclude,
    orderBy: { decisionDate: "desc" },
    take: limit,
  });
  return rows.map(mapDecision);
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export async function getAllDecisions(): Promise<Decision[]> {
  const rows = await prisma.decision.findMany({
    include: decisionListInclude,
    orderBy: { decisionDate: "desc" },
  });
  return rows.map(mapDecision);
}

const decisionDetailInclude = {
  participants: { include: { person: true } },
  evidence: { include: { knowledgeSource: { include: knowledgeListInclude } } },
  timelineEvents: { orderBy: { eventDate: "asc" } },
} satisfies Prisma.DecisionInclude;

export async function getDecisionDetail(id: string): Promise<DecisionDetail | null> {
  const row = await prisma.decision.findUnique({
    where: { id },
    include: decisionDetailInclude,
  });
  if (!row) return null;

  const owner = row.participants.find((p) => p.role === "Owner");
  const involvedPeople: Person[] = row.participants.map((p) => mapPersonBasic(p.person));

  const evidence: EvidenceItem[] = row.evidence.map((e) => ({
    excerpt: e.excerpt,
    knowledgeSource: mapKnowledgeSource(e.knowledgeSource),
  }));

  const trail: DecisionTrailStep[] = row.timelineEvents.map((t) => ({
    id: t.id,
    date: t.eventDate.toISOString(),
    type: t.type as TimelineEventType,
    title: t.title,
    description: t.description,
  }));

  return {
    id: row.id,
    title: row.title,
    status: row.status as DecisionStatus,
    date: row.decisionDate.toISOString(),
    ownerId: owner?.personId ?? null,
    ownerName: owner?.person.name ?? null,
    reason: row.reason,
    whatDescription: row.summary,
    whyDescription: row.reason,
    outcome: row.outcome,
    peopleIds: row.participants.map((p) => p.personId),
    people: row.participants.map((p) => ({
      id: p.person.id,
      name: p.person.name,
      initials: getInitials(p.person.name),
    })),
    evidenceIds: row.evidence.map((e) => e.knowledgeSourceId),
    owner: owner ? mapPersonBasic(owner.person) : null,
    involvedPeople,
    evidence,
    trail,
  };
}

// ---------------------------------------------------------------------------
// Knowledge
// ---------------------------------------------------------------------------

export async function getAllKnowledgeSources(): Promise<KnowledgeSource[]> {
  const rows = await prisma.knowledgeSource.findMany({
    include: knowledgeListInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapKnowledgeSource);
}

/** Raw text content, for the AI retrieval context in /api/ask — not part of the UI view-model. */
export async function getKnowledgeSourceTexts() {
  return prisma.knowledgeSource.findMany({
    select: { id: true, title: true, type: true, content: true, createdAt: true },
  });
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export async function getAllPeople(): Promise<Person[]> {
  const rows = await prisma.person.findMany({
    include: personListInclude,
    orderBy: { name: "asc" },
  });
  return rows.map(mapPerson);
}

export async function getPersonDetail(id: string): Promise<PersonDetail | null> {
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) return null;

  const participations = await prisma.decisionParticipant.findMany({
    where: { personId: id },
    include: { decision: { include: decisionListInclude } },
  });
  const decisions = participations.map((p) => mapDecision(p.decision)).sort(byDateDesc);

  const knowledgeRows = await prisma.knowledgeSource.findMany({
    where: { addedById: id },
    include: knowledgeListInclude,
    orderBy: { createdAt: "desc" },
  });
  const knowledgeSources = knowledgeRows.map(mapKnowledgeSource);

  const activity = await getRecentActivityForPerson(id, 6);

  return {
    person: {
      id: person.id,
      name: person.name,
      role: person.role,
      department: person.department,
      initials: getInitials(person.name),
      decisionIds: decisions.map((d) => d.id),
      knowledgeIds: knowledgeSources.map((k) => k.id),
    },
    decisions,
    knowledgeSources,
    activity,
  };
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export async function getTimelineEvents(): Promise<TimelineEvent[]> {
  const rows = await prisma.timelineEvent.findMany({
    orderBy: { eventDate: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    date: row.eventDate.toISOString(),
    type: row.type as TimelineEventType,
    title: row.title,
    description: row.description,
    decisionId: row.decisionId ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// Recent activity — derived from the most recent TimelineEvents.
// ---------------------------------------------------------------------------

const activityInclude = {
  decision: {
    include: { participants: { where: { role: "Owner" }, include: { person: true } } },
  },
  knowledgeSource: { include: { addedBy: true } },
} satisfies Prisma.TimelineEventInclude;

type ActivityRow = Prisma.TimelineEventGetPayload<{ include: typeof activityInclude }>;

const STATUS_ACTIVITY_TYPE: Record<DecisionStatus, ActivityType> = {
  Approved: "decision_approved",
  Deferred: "decision_deferred",
  Rejected: "decision_rejected",
  Pending: "decision_pending",
};

const STATUS_PHRASE: Record<DecisionStatus, string> = {
  Approved: "was approved",
  Deferred: "was deferred",
  Rejected: "was rejected",
  Pending: "is pending review",
};

function mapActivity(row: ActivityRow): Activity {
  if (row.type === "decision" && row.decision) {
    const status = row.decision.status as DecisionStatus;
    const owner = row.decision.participants[0]?.person;
    return {
      id: row.id,
      type: STATUS_ACTIVITY_TYPE[status],
      description: `“${row.decision.title}” ${STATUS_PHRASE[status]}`,
      timestamp: formatRelativeTime(row.createdAt),
      personId: owner?.id,
      personName: owner?.name,
    };
  }

  if (row.type === "meeting" || row.type === "document") {
    const source = row.knowledgeSource;
    const label = source?.title ?? row.title;
    return {
      id: row.id,
      type: row.type === "meeting" ? "meeting_notes_added" : "evidence_attached",
      description:
        row.type === "meeting" ? `Notes added for ${label}` : `${label} attached as evidence`,
      timestamp: formatRelativeTime(row.createdAt),
      personId: source?.addedById ?? undefined,
      personName: source?.addedBy?.name,
    };
  }

  const isPersonJoined = row.title.toLowerCase().includes("joined");
  return {
    id: row.id,
    type: isPersonJoined ? "person_added" : "milestone",
    description: row.title,
    timestamp: formatRelativeTime(row.createdAt),
  };
}

export async function getRecentActivity(limit: number): Promise<Activity[]> {
  const rows = await prisma.timelineEvent.findMany({
    include: activityInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(mapActivity);
}

/** Recent activity filtered to a single person — used on the Person Detail page. */
export async function getRecentActivityForPerson(personId: string, limit: number): Promise<Activity[]> {
  const rows = await prisma.timelineEvent.findMany({
    include: activityInclude,
    orderBy: { createdAt: "desc" },
    take: 100, // small MVP-scale dataset — fetch a batch and filter, rather than a bespoke query
  });
  return rows
    .map(mapActivity)
    .filter((a) => a.personId === personId)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Retrieval dataset — shared by /api/search and /api/ask. Small dataset, so
// both endpoints fetch everything and filter/rank in plain JavaScript
// rather than relying on database-specific full-text search.
// ---------------------------------------------------------------------------

export async function getRetrievalDataset() {
  const [decisions, people, knowledge] = await Promise.all([
    getAllDecisions(),
    getAllPeople(),
    getAllKnowledgeSources(),
  ]);
  return { decisions, people, knowledge };
}
