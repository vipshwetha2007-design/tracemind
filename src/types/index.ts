/**
 * Shared view-model types for TraceMind's UI.
 *
 * These are deliberately NOT the raw Prisma model types. src/lib/queries.ts
 * reads from the database via Prisma and maps the results into these
 * shapes, so every page/component below it works with the same simple,
 * UI-friendly objects regardless of how the data was fetched or joined.
 * (In Stage 1 these same shapes were filled from static mock data; in
 * Stage 2 they're filled from real database queries — the UI layer didn't
 * need to change.)
 */

/** Lifecycle state of a decision. Stored as a plain string column (SQLite has no enum type). */
export type DecisionStatus = "Approved" | "Pending" | "Deferred" | "Rejected";

/** The kind of knowledge source that backs a decision. */
export type KnowledgeType = "Document" | "Meeting";

/** The kind of event shown on the institutional timeline / a decision's trail. */
export type TimelineEventType = "decision" | "meeting" | "document" | "event";

/** The kind of entry shown in the "Recent Activity" feed. */
export type ActivityType =
  | "decision_approved"
  | "decision_pending"
  | "decision_deferred"
  | "decision_rejected"
  | "meeting_notes_added"
  | "evidence_attached"
  | "person_added"
  | "milestone";

/** A single step in a decision's traceability trail (derived from TimelineEvents). */
export interface DecisionTrailStep {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  description: string;
}

/** A person who takes part in institutional decisions. */
export interface Person {
  id: string;
  name: string;
  role: string;
  department: string;
  initials: string;
  decisionIds: string[];
  knowledgeIds: string[];
}

/** A document or meeting that forms part of the institutional memory. */
export interface KnowledgeSource {
  id: string;
  title: string;
  type: KnowledgeType;
  date: string;
  addedById: string | null;
  addedByName: string | null;
  linkedDecisionIds: string[];
}

/** A decision made by the organization, and the reasoning behind it. */
export interface Decision {
  id: string;
  title: string;
  status: DecisionStatus;
  date: string;
  ownerId: string | null;
  /** Resolved for display, so cards don't need a separate people lookup. */
  ownerName: string | null;
  reason: string;
  whatDescription: string;
  whyDescription: string;
  outcome: string | null;
  peopleIds: string[];
  /** Resolved participant summaries (id/name/initials), same order as peopleIds. */
  people: { id: string; name: string; initials: string }[];
  evidenceIds: string[];
}

/** A piece of evidence shown on a Decision Detail page: a knowledge source plus the excerpt that supports the decision. */
export interface EvidenceItem {
  knowledgeSource: KnowledgeSource;
  excerpt: string;
}

/** The full Decision Detail payload: the decision plus its resolved relations. */
export interface DecisionDetail extends Decision {
  owner: Person | null;
  involvedPeople: Person[];
  evidence: EvidenceItem[];
  trail: DecisionTrailStep[];
}

/** The full Person Detail payload. */
export interface PersonDetail {
  person: Person;
  decisions: Decision[];
  knowledgeSources: KnowledgeSource[];
  activity: Activity[];
}

/** An entry in the chronological institutional timeline. */
export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  description: string;
  decisionId?: string;
}

/** An entry in the "Recent Activity" feed. */
export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  personId?: string;
  /** Resolved for display, so the feed doesn't need a separate people lookup. */
  personName?: string;
}

// ---------------------------------------------------------------------------
// AI / API payload types
// ---------------------------------------------------------------------------

/** A grouped, "did you mean one of these" style search result set. */
export interface SearchResults {
  decisions: { id: string; title: string; status: DecisionStatus }[];
  people: { id: string; name: string; role: string }[];
  knowledge: { id: string; title: string; type: KnowledgeType }[];
}

/** Response shape from POST /api/ask. */
export interface AskResponse {
  answer: string;
  hasSufficientEvidence: boolean;
  sources: { id: string; title: string; type: KnowledgeType }[];
  relatedDecisions: { id: string; title: string; status: DecisionStatus }[];
}
