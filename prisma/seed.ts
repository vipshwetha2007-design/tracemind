/**
 * Prisma seed script — populates a fresh database with realistic demo data
 * so TraceMind looks like a real, lived-in institutional memory immediately
 * after setup, without anyone having to use the Add Knowledge flow first.
 *
 * This is a straight port of the Stage 1 mock data (src/data/mock-data.ts,
 * now removed) into real, relational database rows: the same people,
 * decisions, and knowledge sources, but now connected through actual
 * foreign keys (DecisionParticipant, Evidence, TimelineEvent) instead of
 * id arrays in a static object.
 *
 * Run with: npm run seed   (wraps `tsx prisma/seed.ts`)
 * Re-running it is safe — it clears existing rows first.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const PEOPLE = [
  { key: "arjun", name: "Arjun Raman", role: "Technical Lead", department: "Engineering" },
  { key: "priya", name: "Priya Sharma", role: "Product Manager", department: "Product" },
  { key: "karthik", name: "Karthik Iyer", role: "Engineering Lead", department: "Engineering" },
  { key: "meera", name: "Meera Nair", role: "Finance Lead", department: "Finance" },
  { key: "ananya", name: "Ananya Deshpande", role: "Chief Technology Officer", department: "Leadership" },
  { key: "rohan", name: "Rohan Verma", role: "Operations Manager", department: "Operations" },
] as const;

// ---------------------------------------------------------------------------
// Knowledge sources
// ---------------------------------------------------------------------------

const KNOWLEDGE = [
  {
    key: "k1",
    title: "Q3 Architecture Review.pdf",
    type: "Document",
    fileName: "q3-architecture-review.pdf",
    addedByKey: "arjun",
    date: "2026-09-10",
    content:
      "Q3 Architecture Review — Analytics Platform Datastore\n\n" +
      "Summary: The analytics platform has outgrown its ad-hoc storage approach used during prototyping. " +
      "This review formalizes a recommendation to standardize on PostgreSQL, hosted on Neon, as the " +
      "platform's primary datastore.\n\n" +
      "Findings: Query patterns for the analytics workload are heavily relational (joins across accounts, " +
      "events, and aggregation tables). PostgreSQL's mature tooling, strong relational support, and " +
      "compatibility with the team's existing Prisma-based stack make it the strongest fit. Database " +
      "Comparison.pdf, produced alongside this review, evaluated PostgreSQL against MongoDB and DynamoDB " +
      "in detail.\n\n" +
      "Recommendation: Adopt PostgreSQL for the analytics platform. Owner: Arjun Raman.",
  },
  {
    key: "k2",
    title: "Product Planning Meeting",
    type: "Meeting",
    addedByKey: "priya",
    date: "2026-09-05",
    content:
      "Product Planning Meeting — September 5, 2026\nAttendees: Priya Sharma, Rohan Verma\n\n" +
      "Mobile release readiness: Beta testers reported crashes and slow performance on older Android " +
      "devices. The team discussed shipping on schedule with known issues versus delaying for an " +
      "additional QA cycle. Decision: postpone the public release until the additional QA cycle is " +
      "complete. Priya Sharma to confirm the revised timeline with stakeholders.\n\n" +
      "Facilities: reviewed employee feedback on the proposed open floor plan. Feedback strongly favored " +
      "keeping the current hybrid setup with private and semi-private work areas. Rohan Verma to formally " +
      "close out the floor plan proposal as not proceeding.",
  },
  {
    key: "k3",
    title: "Infrastructure Comparison.pdf",
    type: "Document",
    fileName: "infrastructure-comparison.pdf",
    addedByKey: "karthik",
    date: "2026-08-28",
    content:
      "Infrastructure Vendor Comparison\n\n" +
      "Three infrastructure vendors were evaluated ahead of the hosting contract renewal: Vertex Labs, " +
      "Northbridge Cloud, and Ionosphere. Vendors were ranked on SLA terms (uptime guarantees, incident " +
      "response times), estimated migration effort, and support quality based on reference calls.\n\n" +
      "Vertex Labs scored highest overall: a 99.95% uptime SLA, a dedicated support contact, and the " +
      "lowest estimated migration effort of the three (existing Terraform modules are largely compatible). " +
      "Recommendation: proceed with Vertex Labs, pending budget confirmation from Finance.",
  },
  {
    key: "k4",
    title: "Budget Review Meeting",
    type: "Meeting",
    addedByKey: "meera",
    date: "2026-08-20",
    content:
      "Budget Review Meeting — August 20, 2026\nAttendees: Meera Nair, Karthik Iyer\n\n" +
      "Reviewed the proposed Vertex Labs infrastructure contract against the current infrastructure " +
      "budget. The contract fits within the approved annual spend with headroom remaining. Finance signs " +
      "off on proceeding with Vertex Labs.\n\n" +
      "Also reviewed current engineering headcount spend ahead of an anticipated Q4 headcount request " +
      "from Engineering; asked Karthik Iyer to submit a formal proposal once Q4 roadmap planning " +
      "concludes.",
  },
  {
    key: "k5",
    title: "Mobile Release Notes.pdf",
    type: "Document",
    fileName: "mobile-release-notes.pdf",
    addedByKey: "priya",
    date: "2026-09-01",
    content:
      "Mobile App — Release Readiness Notes\n\n" +
      "Open defects ahead of the planned September release: intermittent crashes on Android 11 devices " +
      "during onboarding (high priority), slow image loading on low-end devices (medium priority), and " +
      "two minor UI inconsistencies on tablet layouts (low priority).\n\n" +
      "Test coverage gap: automated tests do not currently cover the onboarding flow on Android 11, which " +
      "is where the crash reports originate. Recommend an additional QA cycle focused on this flow before " +
      "release.",
  },
  {
    key: "k6",
    title: "Database Comparison.pdf",
    type: "Document",
    fileName: "database-comparison.pdf",
    addedByKey: "arjun",
    date: "2026-09-08",
    content:
      "Database Technology Comparison — Analytics Platform\n\n" +
      "Evaluated PostgreSQL, MongoDB, and DynamoDB against the analytics platform's requirements: complex " +
      "relational queries, strong consistency, and compatibility with the team's existing Prisma-based " +
      "tooling.\n\n" +
      "PostgreSQL supports the platform's join-heavy query patterns natively and integrates directly with " +
      "the existing Prisma schema. MongoDB and DynamoDB would both require significant query-layer " +
      "rework and lose strong relational guarantees. Recommendation: PostgreSQL, hosted on Neon for " +
      "managed scaling and backups.",
  },
  {
    key: "k7",
    title: "Vendor Evaluation Meeting",
    type: "Meeting",
    addedByKey: "ananya",
    date: "2026-08-25",
    content:
      "Vendor Evaluation Meeting — August 25, 2026\nAttendees: Ananya Deshpande, Karthik Iyer, Meera Nair\n\n" +
      "Walked through the Infrastructure Comparison.pdf findings for the three candidate infrastructure " +
      "vendors. Discussed migration risk and support quality in detail based on reference customer calls. " +
      "Consensus: Vertex Labs is the strongest option, pending Finance's budget review.",
  },
] as const;

// ---------------------------------------------------------------------------
// Decisions — each with its participants, evidence, and a full trail of
// TimelineEvents that becomes that decision's "Decision Trail".
// ---------------------------------------------------------------------------

const DECISIONS = [
  {
    key: "d1",
    title: "Adopt PostgreSQL for the analytics platform",
    status: "Approved",
    summary:
      "The analytics platform will standardize on PostgreSQL (hosted on Neon) as its primary datastore, " +
      "replacing the mix of ad-hoc storage used during prototyping.",
    reason:
      "PostgreSQL was selected after the architecture review because it provided stronger relational data " +
      "support, mature tooling, and better compatibility with the team's existing infrastructure than the " +
      "alternatives considered. It also has a proven track record for the query patterns the analytics " +
      "platform needs.",
    outcome:
      "The migration to PostgreSQL on Neon completed without incident. Query performance for the " +
      "platform's core reporting views improved, and the team has not needed to revisit the decision.",
    decisionDate: "2026-09-14",
    ownerKey: "arjun",
    participantKeys: ["karthik", "ananya"],
    evidence: [
      { knowledgeKey: "k1", excerpt: "Recommendation: Adopt PostgreSQL for the analytics platform. Owner: Arjun Raman." },
      { knowledgeKey: "k6", excerpt: "PostgreSQL supports the platform's join-heavy query patterns natively and integrates directly with the existing Prisma schema." },
    ],
    trail: [
      { date: "2026-08-30", type: "event", title: "Problem Identified", description: "Ad-hoc storage choices during prototyping were creating inconsistent query performance and reporting gaps." },
      { date: "2026-09-06", type: "meeting", title: "Architecture Meeting", description: "Engineering leadership met to define requirements for the analytics platform's long-term datastore." },
      { date: "2026-09-08", type: "document", title: "Technical Comparison Document", description: "Database Comparison.pdf evaluated PostgreSQL, MongoDB, and DynamoDB against the platform's query and consistency requirements.", knowledgeKey: "k6" },
      { date: "2026-09-10", type: "document", title: "Proposal Created", description: "Q3 Architecture Review.pdf formalized the recommendation to standardize on PostgreSQL.", knowledgeKey: "k1" },
      { date: "2026-09-14", type: "decision", title: "Final Decision Approved", description: "Arjun Raman approved the adoption of PostgreSQL for the analytics platform." },
    ],
  },
  {
    key: "d2",
    title: "Postpone mobile application release",
    status: "Deferred",
    summary:
      "The mobile application's public release is postponed from its original September date to allow for " +
      "further quality assurance.",
    reason:
      "During product planning, testing surfaced stability issues on older Android devices. The team " +
      "agreed that shipping on schedule would risk a poor first impression, so the release was deferred " +
      "until an additional QA cycle is complete.",
    outcome: null,
    decisionDate: "2026-09-11",
    ownerKey: "priya",
    participantKeys: ["rohan"],
    evidence: [
      { knowledgeKey: "k5", excerpt: "Recommend an additional QA cycle focused on this flow before release." },
      { knowledgeKey: "k2", excerpt: "Decision: postpone the public release until the additional QA cycle is complete." },
    ],
    trail: [
      { date: "2026-08-27", type: "event", title: "Problem Identified", description: "Beta testers reported crashes and slow performance on older Android devices." },
      { date: "2026-09-01", type: "document", title: "Release Readiness Notes", description: "Mobile Release Notes.pdf documented open defects and outstanding test coverage gaps.", knowledgeKey: "k5" },
      { date: "2026-09-05", type: "meeting", title: "Product Planning Meeting", description: "Product and Operations reviewed release readiness and weighed the cost of delaying against launching with known issues.", knowledgeKey: "k2" },
      { date: "2026-09-11", type: "decision", title: "Final Decision: Postponed", description: "Priya Sharma confirmed the release would be postponed pending an additional QA cycle." },
    ],
  },
  {
    key: "d3",
    title: "Select Vertex Labs as infrastructure partner",
    status: "Approved",
    summary:
      "Vertex Labs was selected as the organization's infrastructure and hosting partner for the next " +
      "contract cycle.",
    reason:
      "Three vendors were evaluated on cost, SLA guarantees, and support responsiveness. Vertex Labs " +
      "offered the strongest combination of the three, and the budget review confirmed the contract fit " +
      "within the approved infrastructure spend.",
    outcome:
      "Migration to Vertex Labs is complete. The new SLA has held since cutover, with no incidents " +
      "outside the agreed response-time terms.",
    decisionDate: "2026-08-30",
    ownerKey: "meera",
    participantKeys: ["karthik", "ananya"],
    evidence: [
      { knowledgeKey: "k3", excerpt: "Vertex Labs scored highest overall: a 99.95% uptime SLA, a dedicated support contact, and the lowest estimated migration effort of the three." },
      { knowledgeKey: "k4", excerpt: "The contract fits within the approved annual spend with headroom remaining. Finance signs off on proceeding with Vertex Labs." },
      { knowledgeKey: "k7", excerpt: "Consensus: Vertex Labs is the strongest option, pending Finance's budget review." },
    ],
    trail: [
      { date: "2026-08-18", type: "event", title: "Problem Identified", description: "The existing hosting contract was approaching renewal, prompting a review of alternatives." },
      { date: "2026-08-20", type: "meeting", title: "Budget Review Meeting", description: "Finance confirmed the proposed contract fit within the approved infrastructure budget.", knowledgeKey: "k4" },
      { date: "2026-08-25", type: "meeting", title: "Vendor Evaluation Meeting", description: "Engineering and leadership evaluated three infrastructure vendors against cost and reliability criteria.", knowledgeKey: "k7" },
      { date: "2026-08-28", type: "document", title: "Technical Comparison Document", description: "Infrastructure Comparison.pdf ranked vendors on SLA terms, migration effort, and support quality.", knowledgeKey: "k3" },
      { date: "2026-08-30", type: "decision", title: "Final Decision Approved", description: "Meera Nair approved Vertex Labs as the new infrastructure partner." },
    ],
  },
  {
    key: "d4",
    title: "Increase engineering headcount for Q4",
    status: "Pending",
    summary:
      "A proposal to add four engineering headcount in Q4 to support the analytics platform roadmap is " +
      "under review.",
    reason:
      "Engineering leadership identified a capacity gap for the Q4 roadmap. The proposal has been " +
      "submitted to Finance for budget approval and is awaiting a final decision.",
    outcome: null,
    decisionDate: "2026-09-16",
    ownerKey: "karthik",
    participantKeys: ["meera"],
    evidence: [
      { knowledgeKey: "k4", excerpt: "Asked Karthik Iyer to submit a formal proposal once Q4 roadmap planning concludes." },
    ],
    trail: [
      { date: "2026-09-12", type: "event", title: "Problem Identified", description: "Q4 roadmap planning revealed a capacity gap on the analytics platform team." },
      { date: "2026-08-20", type: "meeting", title: "Budget Review Meeting", description: "Finance reviewed current engineering spend ahead of the headcount proposal.", knowledgeKey: "k4" },
      { date: "2026-09-16", type: "event", title: "Proposal Submitted", description: "Karthik Iyer submitted a formal headcount request to Finance for review." },
    ],
  },
  {
    key: "d5",
    title: "Migrate CI/CD pipeline to GitHub Actions",
    status: "Approved",
    summary:
      "The build and deployment pipeline is migrating from the self-hosted CI runner to GitHub Actions.",
    reason:
      "The self-hosted runner required ongoing maintenance and had grown unreliable under load. GitHub " +
      "Actions offered comparable build times with far less operational overhead, as documented in the Q3 " +
      "architecture review.",
    outcome:
      "Migration completed for all active repositories. Build times are comparable to the self-hosted " +
      "runner, and the team has not had to spend time on CI maintenance since cutover.",
    decisionDate: "2026-09-02",
    ownerKey: "arjun",
    participantKeys: ["rohan"],
    evidence: [
      { knowledgeKey: "k1", excerpt: "The self-hosted CI runner required ongoing maintenance; GitHub Actions offered comparable build times with far less operational overhead." },
    ],
    trail: [
      { date: "2026-08-22", type: "event", title: "Problem Identified", description: "The self-hosted CI runner suffered repeated outages, delaying releases." },
      { date: "2026-09-06", type: "meeting", title: "Architecture Meeting", description: "Engineering reviewed CI/CD options as part of the broader Q3 architecture review." },
      { date: "2026-09-02", type: "decision", title: "Final Decision Approved", description: "Arjun Raman approved the migration to GitHub Actions." },
    ],
  },
  {
    key: "d6",
    title: "Reject open office floor plan proposal",
    status: "Rejected",
    summary:
      "A proposal to convert the office to a fully open floor plan was reviewed and rejected.",
    reason:
      "Employee feedback collected during product planning discussions showed a strong preference for " +
      "retaining private and semi-private work areas under the current hybrid setup, so the proposal did " +
      "not move forward.",
    outcome: null,
    decisionDate: "2026-08-18",
    ownerKey: "rohan",
    participantKeys: ["priya"],
    evidence: [
      { knowledgeKey: "k2", excerpt: "Feedback strongly favored keeping the current hybrid setup with private and semi-private work areas." },
    ],
    trail: [
      { date: "2026-08-10", type: "event", title: "Problem Identified", description: "Facilities proposed an open floor plan to accommodate team growth." },
      { date: "2026-09-05", type: "meeting", title: "Product Planning Meeting", description: "Employee feedback on the proposal was reviewed alongside other planning topics.", knowledgeKey: "k2" },
      { date: "2026-08-18", type: "decision", title: "Final Decision: Rejected", description: "Rohan Verma confirmed the proposal would not proceed." },
    ],
  },
] as const;

// A couple of standalone timeline events not tied to any decision or
// knowledge source — e.g. team changes — so the Timeline page shows a mix
// of event kinds, not just decisions and documents.
const STANDALONE_EVENTS = [
  {
    date: "2026-08-04",
    type: "event",
    title: "Rohan Verma joined as Operations Manager",
    description: "Rohan Verma joined the Operations team.",
  },
];

async function main() {
  console.log("Seeding TraceMind demo data...");

  // Clear existing data (children first, to respect foreign keys).
  await prisma.timelineEvent.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.decisionParticipant.deleteMany();
  await prisma.decision.deleteMany();
  await prisma.knowledgeSource.deleteMany();
  await prisma.person.deleteMany();

  // People
  const personIdByKey = new Map<string, string>();
  for (const p of PEOPLE) {
    const created = await prisma.person.create({
      data: { name: p.name, role: p.role, department: p.department },
    });
    personIdByKey.set(p.key, created.id);
  }
  console.log(`Created ${personIdByKey.size} people.`);

  // Knowledge sources
  const knowledgeIdByKey = new Map<string, string>();
  for (const k of KNOWLEDGE) {
    const created = await prisma.knowledgeSource.create({
      data: {
        title: k.title,
        type: k.type,
        content: k.content,
        fileName: "fileName" in k ? k.fileName : null,
        addedById: personIdByKey.get(k.addedByKey),
        createdAt: new Date(k.date),
      },
    });
    knowledgeIdByKey.set(k.key, created.id);
  }
  console.log(`Created ${knowledgeIdByKey.size} knowledge sources.`);

  // Decisions, with participants, evidence, and trail (timeline events)
  let decisionCount = 0;
  let timelineCount = 0;
  for (const d of DECISIONS) {
    const decision = await prisma.decision.create({
      data: {
        title: d.title,
        status: d.status,
        summary: d.summary,
        reason: d.reason,
        outcome: d.outcome,
        decisionDate: new Date(d.decisionDate),
      },
    });
    decisionCount++;

    await prisma.decisionParticipant.create({
      data: { decisionId: decision.id, personId: personIdByKey.get(d.ownerKey)!, role: "Owner" },
    });
    for (const key of d.participantKeys) {
      await prisma.decisionParticipant.create({
        data: { decisionId: decision.id, personId: personIdByKey.get(key)!, role: "Participant" },
      });
    }

    for (const e of d.evidence) {
      await prisma.evidence.create({
        data: {
          decisionId: decision.id,
          knowledgeSourceId: knowledgeIdByKey.get(e.knowledgeKey)!,
          excerpt: e.excerpt,
        },
      });
    }

    for (const t of d.trail) {
      await prisma.timelineEvent.create({
        data: {
          title: t.title,
          type: t.type,
          description: t.description,
          eventDate: new Date(t.date),
          decisionId: decision.id,
          knowledgeSourceId: "knowledgeKey" in t && t.knowledgeKey ? knowledgeIdByKey.get(t.knowledgeKey) : null,
        },
      });
      timelineCount++;
    }
  }
  console.log(`Created ${decisionCount} decisions with participants, evidence, and trail events.`);

  for (const e of STANDALONE_EVENTS) {
    await prisma.timelineEvent.create({
      data: {
        title: e.title,
        type: e.type,
        description: e.description,
        eventDate: new Date(e.date),
      },
    });
    timelineCount++;
  }
  console.log(`Created ${timelineCount} timeline events in total.`);

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
