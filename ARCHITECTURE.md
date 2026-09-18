# TraceMind — Architecture Guide

This document exists so you can explain every part of this system in a technical
evaluation: what each folder and file does, why it exists, how a request flows
through the app, and exactly what changes if you need to modify something. Read
it top to bottom once, then use it as a reference.

---

## 1. System Overview

TraceMind is a Next.js App Router application backed by a SQLite database
(via Prisma ORM) and Google Gemini for AI extraction and question-answering.

The product's core idea: organizations make decisions through meetings and
documents, and the *reasoning* behind a decision gets lost over time.
TraceMind captures that reasoning at the moment knowledge is added, and
makes it traceable later — you can open any decision and see exactly which
people, meetings, and documents led to it.

Two things happen in this app:

1. **Reading** — every page (Overview, Decisions, Knowledge, People,
   Timeline, and their detail pages) is a Server Component that queries the
   database directly through `src/lib/queries.ts` and renders HTML on the
   server. There is no client-side data-fetching for these pages.
2. **Writing / AI** — three things require a server round-trip from the
   browser: adding knowledge (with AI extraction), asking a question, and
   the header search. Each has its own API route under `src/app/api/`.

---

## 2. Complete Architecture Diagram

```
                        ┌─────────────────────────┐
                        │        Browser           │
                        │  (Next.js Client/Server  │
                        │      Components)          │
                        └────────────┬─────────────┘
                                     │
                 ┌───────────────────┼───────────────────────┐
                 │                   │                        │
        Server Component      Client Component          Client Component
        page renders          fetch() calls              fetch() calls
        directly via                │                        │
        src/lib/queries.ts          ▼                        ▼
                 │           API Route Handler         API Route Handler
                 │           (src/app/api/.../route.ts)
                 │                   │                        │
                 ▼                   ▼                        ▼
        ┌──────────────────────────────────────────────────────────┐
        │                    src/lib/prisma.ts                      │
        │              (one shared PrismaClient)                    │
        └───────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │   SQLite (prisma/dev.db) │
                        └─────────────────────────┘

        API routes that need AI also call:
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │      src/lib/gemini.ts    │
                        │  (the only file that      │
                        │   talks to Gemini)         │
                        └────────────┬─────────────┘
                                     │
                                     ▼
                        ┌─────────────────────────┐
                        │   Google Gemini API       │
                        └─────────────────────────┘
```

**The one-line version:** `User → Next.js Page or API Route → Prisma
(and, for AI features, Gemini) → SQLite`.

---

## 3. Folder Structure

```
prisma/
  schema.prisma        The database schema — the source of truth for every table.
  seed.ts               Populates a fresh database with realistic demo data.

src/
  app/                  Routes. One folder per URL (Next.js App Router convention).
    page.tsx                       "/"                      Overview dashboard
    decisions/page.tsx             "/decisions"             Decisions list
    decisions/[id]/page.tsx        "/decisions/:id"         Decision detail + trail
    knowledge/page.tsx             "/knowledge"             Knowledge list
    knowledge/add/page.tsx         "/knowledge/add"         AI ingestion flow
    people/page.tsx                "/people"                People directory
    people/[id]/page.tsx           "/people/:id"            Person detail
    timeline/page.tsx              "/timeline"              Institutional timeline
    ask/page.tsx                   "/ask"                   Ask TraceMind
    settings/page.tsx              "/settings"              Settings (UI-only)
    api/                           API routes — see section 5
    layout.tsx / globals.css       Root layout and design tokens

  components/           Reusable UI, grouped by where it's used.
    layout/               Sidebar, Header, HeaderSearch, AppShell — present on every page.
    shared/                Small pieces reused everywhere: PageHeader, StatCard, StatusBadge, Avatar.
    dashboard/              Overview-only: ActivityFeed, DecisionActivityChart.
    decisions/               DecisionCard, DecisionsView (list + filters), DecisionTrail.
    knowledge/                KnowledgeCard, KnowledgeView (list + filters).
    people/                    PersonCard.

  lib/                  Server-side logic, one clear responsibility per file.
    prisma.ts              The single shared PrismaClient instance.
    queries.ts               Every database READ used by a page (see section 4).
    gemini.ts                 The only file that talks to Google Gemini.
    retrieval.ts                Keyword search/ranking shared by /api/ask and /api/search.
    format.ts                    Pure display-formatting helpers (dates, initials, relative time).

  types/index.ts        Shared TypeScript view-model types (Decision, Person, etc.)
```

**Why no `src/data/` folder anymore:** Stage 1 had `src/data/mock-data.ts`
as the single source of demo data. Stage 2 replaced that entirely with the
real database — `prisma/seed.ts` is now what populates realistic demo data,
and every page reads through `src/lib/queries.ts` instead.

### Why no `src/app/api/decisions/route.ts`

You'll notice there's no generic "list decisions" or "get decision" API
route, even though a typical REST-style layout would include one. That's a
deliberate simplification, not an oversight: the Decisions list and Decision
Detail pages are **Server Components** — they run on the server and can call
`src/lib/queries.ts` (which calls Prisma) directly, with zero network hop.
Adding an API route those pages then called over HTTP would be a pure
detour: server code calling itself through an HTTP client for no benefit.

API routes exist in this app **only** where a *Client Component in the
browser* needs to reach the server after the page has already loaded:
submitting the Add Knowledge form, asking a question, and typing into the
search box. That's the whole list, and it's why the API surface is small.

---

## 4. Important Files

| File | What it does | Called by | Calls |
|---|---|---|---|
| `prisma/schema.prisma` | Defines the six database models and their relationships. | `prisma generate`, `prisma db push` | — |
| `prisma/seed.ts` | Clears and repopulates the database with realistic demo data. | `npm run seed` | Prisma Client directly (its own instance, not `src/lib/prisma.ts`, since it runs outside the Next.js server) |
| `src/lib/prisma.ts` | Exports one shared `PrismaClient` instance, reused across hot reloads in dev. | Every file in `src/lib/queries.ts` and every API route that writes to the DB | `@prisma/client` |
| `src/lib/queries.ts` | Every database *read* the UI needs, mapped from raw Prisma rows into the view-model types in `src/types/index.ts`. One function per "thing a page needs" (e.g. `getDecisionDetail`, `getAllPeople`). | Every page in `src/app/**/page.tsx`; `/api/ask` and `/api/search` | `src/lib/prisma.ts` |
| `src/lib/gemini.ts` | The only file that imports the Gemini SDK. Exposes `extractKnowledge(text)` and `answerQuestion(question, context)`. Validates Gemini's JSON output with Zod before returning it — never trusts it blindly. | `/api/knowledge/analyze`, `/api/knowledge/save` (for the shared Zod schema), `/api/ask` | Google Gemini API |
| `src/lib/retrieval.ts` | `tokenize()` and `rankByTokens()` — the simple keyword-matching used to decide which decisions/people/sources are relevant to a question or search term. | `/api/ask`, `/api/search` | — |
| `src/lib/format.ts` | Pure functions: `getInitials`, `formatDate`, `formatLongDate`, `formatRelativeTime`. No server-only imports, so both Server and Client Components can use them. | `queries.ts`, several components | — |
| `src/app/api/knowledge/analyze/route.ts` | Extracts text from meeting notes or an uploaded PDF/TXT file, sends it to `gemini.ts`, returns the structured extraction for review. Writes nothing to the database. | `src/app/knowledge/add/page.tsx` | `pdf-parse`, `src/lib/gemini.ts` |
| `src/app/api/knowledge/save/route.ts` | Persists a *reviewed and approved* extraction: creates the KnowledgeSource, upserts People, creates Decisions/DecisionParticipants/Evidence/TimelineEvents, all in one transaction. | `src/app/knowledge/add/page.tsx` | `src/lib/prisma.ts` |
| `src/app/api/ask/route.ts` | Retrieves relevant decisions/people/sources from the database, builds a text context, asks Gemini to answer strictly from that context. | `src/app/ask/page.tsx` | `src/lib/queries.ts`, `src/lib/retrieval.ts`, `src/lib/gemini.ts` |
| `src/app/api/search/route.ts` | Same retrieval approach as `/api/ask`, but returns raw grouped matches (no AI call) for the header search dropdown. | `src/components/layout/HeaderSearch.tsx` | `src/lib/queries.ts`, `src/lib/retrieval.ts` |
| `src/app/knowledge/add/page.tsx` | The Add Knowledge UI: form → AI Extraction Review → save. All client-side state (no server component needed, since nothing here is rendered from the database at load time). | User navigation from `/knowledge` or `/decisions` | `/api/knowledge/analyze`, `/api/knowledge/save` |
| `src/types/index.ts` | The shapes every component expects (`Decision`, `Person`, `KnowledgeSource`, etc.) — deliberately decoupled from Prisma's generated types, so `queries.ts` is the only place that needs to know how the database is actually shaped. | Everywhere | — |

---

## 5. API Endpoints

| Endpoint | Method | Purpose | Frontend caller | Database / AI affected |
|---|---|---|---|---|
| `/api/knowledge/analyze` | POST | Extract text from notes/file, run Gemini extraction | `knowledge/add/page.tsx` | Gemini only — no DB write |
| `/api/knowledge/save` | POST | Persist a reviewed extraction | `knowledge/add/page.tsx` | Writes: KnowledgeSource, Person, Decision, DecisionParticipant, Evidence, TimelineEvent |
| `/api/ask` | POST | Answer a question from institutional context | `ask/page.tsx` | Reads: Decision, Person, KnowledgeSource. Calls Gemini. |
| `/api/search` | GET | Grouped keyword search for the header | `HeaderSearch.tsx` | Reads: Decision, Person, KnowledgeSource. No AI call. |

That's the entire API surface. (See section 3 for why there's no
`/api/decisions` or `/api/people` — those pages read the database directly
as Server Components.)

---

## 6. Knowledge Ingestion Flow

```
User fills in meeting notes (or uploads a PDF/TXT)
  │
  ▼
knowledge/add/page.tsx  →  POST /api/knowledge/analyze
  │                              │
  │                              ├─ PDF? extract text with pdf-parse
  │                              ├─ TXT? decode as UTF-8
  │                              ├─ Meeting notes? use the text as-is
  │                              │
  │                              ▼
  │                        gemini.extractKnowledge(text)
  │                              │  (Gemini call, JSON response,
  │                              │   validated against a Zod schema)
  │                              ▼
  │                     { summary, people[], decisions[], actionItems[] }
  │                              │
  ◄──────────────────────────────┘
  │
  ▼
"AI Extraction Review" screen — nothing saved yet.
User reviews summary / people / decisions / action items.
  │
  │  User clicks "Save to Institutional Memory"
  ▼
POST /api/knowledge/save
  │
  ▼
One Prisma transaction:
  1. Create KnowledgeSource (title, type, content, fileName)
  2. For each detected decision:
       - Create the Decision
       - Resolve each participant name to a Person (create if new)
       - Create DecisionParticipant rows (first participant = "Owner")
       - Create an Evidence row linking the Decision to the KnowledgeSource
       - Create a "decision" TimelineEvent (becomes part of the Decision Trail)
  3. Create a "meeting"/"document" TimelineEvent for the KnowledgeSource itself
  │
  ▼
Database updated → Decisions/Knowledge/People/Timeline/Dashboard pages
now reflect it on their next render (they query the DB fresh every request).
```

The review step is the human-in-the-loop gate: Gemini *suggests* structure,
a person *approves* it, and only the approved version is ever written to the
database. Action items are shown in the review for context but not
persisted (there's no ActionItem table — see the change-impact guide below
for how you'd add one).

---

## 7. Ask TraceMind Flow

```
User asks a question (typed, or one of the four suggested prompts)
  │
  ▼
ask/page.tsx  →  POST /api/ask  { question }
  │
  ▼
tokenize(question)                              (src/lib/retrieval.ts)
  │
  ▼
Load ALL decisions / people / knowledge sources  (src/lib/queries.ts —
                                                    small MVP dataset, so
                                                    this is cheap)
  │
  ▼
rankByTokens(...) — keep only records whose title/summary/content contains
                     at least one question keyword, highest matches first
  │
  ▼
Build a plain-text context string from just those matches
  │
  ▼
gemini.answerQuestion(question, context)  — Gemini is instructed to answer
                                              ONLY from the given context and
                                              to say so plainly if it's
                                              insufficient, never to guess
  │
  ▼
{ answer, hasSufficientEvidence }
  │
  ▼
Response assembled: answer + sources (knowledge sources behind the matched
decisions) + relatedDecisions (top matches) → returned to the page
  │
  ▼
UI shows the answer, "Sources used", and a "View Decision Trail" button
```

If no decisions/people/sources match the question's keywords at all, no
context is sent to Gemini and the API returns the "not enough evidence"
answer directly — Gemini is never given the chance to invent an answer from
nothing.

---

## 8. Decision Traceability Flow

This is the feature the whole product is built around, so it's worth being
precise about exactly how the pieces connect.

```
Person ──┐
         ├──< DecisionParticipant >── Decision ──< Evidence >── KnowledgeSource
         │                                │                          │
         │                                └──< TimelineEvent >───────┘
         │
         └──< KnowledgeSource.addedBy (a Person can add sources directly)
```

- **Decision** holds *what* (`summary`) and *why* (`reason`), plus its
  `status` and an optional `outcome`.
- **DecisionParticipant** is the join table between Person and Decision —
  `role` is `"Owner"` for the decision-maker, `"Participant"` for everyone
  else involved.
- **Evidence** links a Decision to a KnowledgeSource, with the specific
  `excerpt` from that source that supports the decision. This is what the
  Decision Detail page's "Evidence" section shows.
- **TimelineEvent** is the most important connector: it can optionally
  point at *both* a Decision and a KnowledgeSource. A Decision's "Decision
  Trail" (the vertical stepper on its detail page) is simply **all
  TimelineEvents linked to that decision, sorted by date** —
  `getDecisionDetail()` in `queries.ts` does exactly that query.

So when you ask "why was this decision made?", the answer isn't a special
computed field — it's the natural result of walking these relationships:
Decision → its TimelineEvents (chronological story) → the KnowledgeSources
those events reference → the People who added those sources or
participated in the decision.

---

## 9. Change Impact Guide

**"If I change the decision card UI, what file changes?"**
Only `src/components/decisions/DecisionCard.tsx`. It's the single component
used by both the Overview dashboard's "Recent Decisions" and the full
`/decisions` list.

**"If I add a `department` field to Decision, what files are affected?"**
1. `prisma/schema.prisma` — add `department String?` to the `Decision` model.
2. Run `npx prisma db push` (or a proper migration) to apply it.
3. `src/types/index.ts` — add `department` to the `Decision` interface.
4. `src/lib/queries.ts` — include it in `mapDecision()`'s return object.
5. Render it wherever you want it visible (e.g. `DecisionCard.tsx` and/or
   `decisions/[id]/page.tsx`).
No other files need to change.

**"If I change the Gemini prompt, what changes?"**
Only `src/lib/gemini.ts` — the `EXTRACTION_PROMPT` or `ANSWER_PROMPT`
constants. If you change the *shape* of what you ask Gemini to return, also
update the corresponding Zod schema (`ExtractionSchema` or `AnswerSchema`)
in the same file, since the response is validated against it.

**"If I rename `/api/ask`, what frontend code must change?"**
Only the `fetch("/api/ask", ...)` call in `src/app/ask/page.tsx`.

**"If I change the database schema, what steps are required?"**
1. Edit `prisma/schema.prisma`.
2. `npx prisma generate` (regenerates the TypeScript client/types).
3. `npx prisma db push` (applies the change to `prisma/dev.db`) — or, for a
   real migration history, `npx prisma migrate dev --name <description>`.
4. Update `prisma/seed.ts` if the change affects seed data.
5. Update any affected mapper in `src/lib/queries.ts` and the corresponding
   type in `src/types/index.ts`.

**"If I want to support DOCX later, where would I modify the system?"**
`src/app/api/knowledge/analyze/route.ts` — add `.docx` to
`ALLOWED_EXTENSIONS` and a text-extraction branch (e.g. using the `mammoth`
package) alongside the existing PDF/TXT branches. Nothing else in the app
needs to know about file formats — everything downstream just works with
the extracted plain text.

**"If I change the Decision status options, what areas are affected?"**
1. `src/types/index.ts` — the `DecisionStatus` union type.
2. `src/lib/gemini.ts` — the `status` enum inside `ExtractionSchema`, and
   the prompt text that lists the allowed values.
3. `src/components/shared/StatusBadge.tsx` — the icon/color for the new status.
4. `src/components/dashboard/DecisionActivityChart.tsx` — `STATUS_ORDER`
   and `STATUS_COLOR`.
5. `src/lib/queries.ts` — `STATUS_ACTIVITY_TYPE` and `STATUS_PHRASE` (used
   to build "Recent Activity" descriptions).
No database migration is needed — `status` is a plain string column, not a
SQL enum (SQLite doesn't support those; see section 10).

---

## 10. Why Each Technology Was Chosen

**Next.js (App Router)** — one framework for both the UI and the backend
API routes, so there's no separate backend service to stand up, deploy, or
explain. Server Components let pages query the database directly without a
round-trip through an API layer (see section 3). In production, you'd
likely deploy this to Vercel or any Node hosting; the main limitation is
that Server Components require a Node (or edge-with-adjustments) runtime —
this isn't a static site.

**TypeScript** — catches an entire category of "field renamed here but not
there" bugs at compile time, which matters a lot once data flows through
several layers (Prisma → queries.ts → types → components).

**Tailwind CSS** — utility classes kept directly in components meant no
separate stylesheet architecture to maintain, and made the premium/SaaS
visual polish achievable without a design-system library.

**Prisma** — a type-safe query builder and migration tool for SQL
databases. `schema.prisma` is a single readable file that's simultaneously
the documentation of the data model and the source Prisma generates
TypeScript types from, so the database schema and the app's types can never
silently drift apart.

**SQLite** — zero setup for local development (one file, no server process
to run). The schema deliberately avoids SQLite-only features — no enums (SQLite/Prisma
doesn't support them, which is why `status` and `type` fields are plain
strings), no SQLite-specific functions in queries. Moving to Postgres later
is meant to be: change `provider = "sqlite"` to `"postgresql"` in
`schema.prisma`, point `DATABASE_URL` at a Postgres instance, and run a
migration — the application code doesn't need to change. In production,
you'd want Postgres (or another server-based database) for concurrent
writes and durability that a single SQLite file can't provide.

**Google Gemini** — a capable, affordable multimodal LLM with a
straightforward JSON-mode API (`responseMimeType: "application/json"`),
which is what makes the "validate the AI's output before trusting it"
approach in `gemini.ts` clean to implement. Any other LLM with a similar
structured-output mode (OpenAI, Claude, etc.) could replace it by rewriting
`src/lib/gemini.ts` alone — no other file imports the Gemini SDK directly.

### Known limitations of this MVP

- **No authentication.** There's no concept of a logged-in user; the avatar
  in the header is decorative, and knowledge sources added via AI ingestion
  have no "added by" person unless Gemini happens to name one as a
  participant.
- **No vector database / embeddings.** Retrieval for Ask TraceMind and
  search is keyword matching over the full (small) dataset, not semantic
  search. This is intentional for this stage — see section 7 — but won't
  scale gracefully to a large institutional memory without adding one.
- **Action items aren't persisted.** They're extracted and shown for review
  but there's no `ActionItem` table. Adding one would follow the same
  pattern as the other models in `schema.prisma`.
- **No OCR.** Only text-based PDFs and TXT files are supported; scanned
  documents are explicitly out of scope and the UI says so.
- **A few `npm audit` advisories** come from Prisma's own CLI tooling
  (`@prisma/config`'s `deepmerge-ts` dependency) — these affect the
  developer-time CLI, not the application code that actually ships/runs, and
  fixing them requires downgrading Prisma to an older minor version.
