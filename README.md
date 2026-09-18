# TraceMind

**Intelligent Institutional Memory & Decision Traceability Platform**

## Problem

Organizations make important decisions through meetings, discussions, and documents.
Over time the *decision itself* is remembered, but the reasoning behind it — who was
involved, what evidence supported it, what was considered, what happened next — gets
scattered across chat threads, files, and people's memories. Months later nobody can
answer "why did we decide this?" with confidence.

## Solution

TraceMind lets a team feed in its raw institutional knowledge — meeting notes and
documents — and turns it into a structured, traceable record:

```
People → Meetings/Documents → Decisions → Reasons → Evidence → Outcomes
```

You paste in meeting notes or upload a document, an AI extraction step proposes the
people, decisions, and reasoning it found, a human reviews and approves that proposal,
and only then is it saved into TraceMind's institutional memory. From that point every
decision has a full **Decision Trail** — a chronological, evidence-backed answer to
"how and why did this happen?" — and **Ask TraceMind** can answer questions about your
organization's history using only what's actually been recorded, citing its sources.

## Current stage: Stage 2 — Database, AI Ingestion & Ask TraceMind

Stage 1 shipped the full frontend on static mock data. Stage 2 replaces that mock data
with a real (local) database and adds the AI-powered features that make TraceMind
actually useful:

- **Persistence** — SQLite via Prisma ORM. Every page (Overview, Decisions, Knowledge,
  People, Timeline) now reads from the database instead of a static file.
- **AI-assisted knowledge ingestion** — paste meeting notes or upload a PDF/TXT
  document, and Google Gemini extracts the people, decisions, reasoning, and action
  items it finds — for review, not automatic saving (see below).
- **Human-in-the-loop review** — nothing is written to institutional memory until a
  person reviews the AI's extraction and clicks "Save to Institutional Memory."
- **Ask TraceMind** — a real question-answering feature. It retrieves the relevant
  decisions/people/evidence from the database (keyword search, no vector database),
  gives Gemini only that context, and requires it to answer strictly from what was
  retrieved — saying so explicitly when the evidence on file is insufficient, rather
  than guessing.
- **Functional global search** in the header, across decisions, people, and knowledge.

Still explicitly **not** included (see [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the
full list and reasoning): authentication, multi-tenancy, a vector database, OCR for
scanned documents, email/notifications, real-time collaboration, and complex
role-based permissions.

For the complete technical picture — architecture diagram, every important file and
what it does, all API endpoints, the ingestion/Ask/traceability data flows, and a
guide to where to make common changes — see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

## Features

- **Overview dashboard** — live counts, recent decisions, recent activity, all from
  the database.
- **Decisions** — searchable/filterable list; a detail page for each decision showing
  What, Why, Who, When, Outcome, supporting Evidence, and its full Decision Trail.
- **Knowledge** — list of ingested meeting notes and documents; an "Add Knowledge"
  flow that ingests, AI-extracts, and (after your review) saves new institutional
  knowledge.
- **People** — directory with each person's role, department, and a detail page
  showing the decisions and knowledge sources they're linked to.
- **Timeline** — chronological feed of everything that's happened across the
  organization's recorded history.
- **Ask TraceMind** — ask a question in plain language and get an answer sourced from
  what's actually in the database, with linked decisions and evidence excerpts.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) — Server Components read the database directly |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | lucide-react |
| Charts | Recharts |
| Database | SQLite (local dev) via **Prisma ORM** — schema written to move to Postgres with only a provider/URL change |
| AI | **Google Gemini** (`@google/generative-ai`), called only from server-side code |
| Validation | **Zod** — validates/sanitizes every AI response before it's trusted or shown |
| Document text extraction | `pdf-parse` (PDF) — plain text only, no OCR |

No auth library, no vector database, no queue/cache (Redis), no WebSocket layer, and
no ORM other than Prisma were added — Stage 2 only needed what's listed above.

## Setup

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

(`--legacy-peer-deps` works around a known npm 10.9.x resolver issue unrelated to this
project; a plain `npm install` may also work depending on your npm version.)

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env`:

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes, for AI features | Your Google Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Without it, knowledge extraction and Ask TraceMind return a clear error instead of crashing — everything else (browsing existing data) still works. |
| `DATABASE_URL` | Yes | Defaults to `file:./dev.db`, a local SQLite file created inside `prisma/`. No setup needed. |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash` if unset. |

`.env` is git-ignored; only the placeholder `.env.example` is committed, with no real
secrets.

### 3. Set up the database

```bash
npx prisma generate   # generates the Prisma Client from schema.prisma
npx prisma db push    # creates prisma/dev.db with the schema, no migration files needed for this stage
npm run seed           # populates it with realistic demo data (people, decisions, knowledge, timeline)
```

`npm run seed` runs `prisma/seed.ts` (via `tsx`), which clears and repopulates the
database each time it's run — safe to re-run whenever you want to reset to the demo
state.

### 4. Run the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

To verify a production build:

```bash
npm run build
npm run start
```

## Supported document formats

"Add Knowledge" → "Document" accepts **PDF and plain-text (`.txt`) files only**. Text
is extracted directly from the file — there is no OCR, so a **scanned document or an
image-only PDF will extract no usable text**, and the UI says so explicitly rather
than silently producing an empty or wrong result. For anything else (a scanned
contract, a photo of a whiteboard, a Word doc), paste the relevant text into the
"Meeting Notes" option instead.

## Current MVP limitations

- **No OCR** — scanned/image-only PDFs are not readable; see above.
- **No vector database / embeddings** — Ask TraceMind and search use keyword-based
  retrieval over what's stored in SQLite, not semantic similarity. This is intentional
  for this stage (see `ARCHITECTURE.md` for the reasoning) but means phrasing that
  shares no words with the source material may not be found.
- **AI-detected action items are shown for review but not persisted** — there's no
  database table for them yet in this stage's schema, so they're visible in the AI
  Extraction Review screen for context but aren't saved with the rest of the
  knowledge source.
- **No authentication** — the header avatar is decorative; anyone with access to the
  running app can add knowledge and see everything. Not intended for multi-user or
  production use as-is.
- **Single organization / no multi-tenancy** — one shared institutional memory per
  running instance.
- **SQLite in local dev** — fine for demo/dev; the schema was written to move to
  Postgres with only a `provider`/`url` change in `prisma/schema.prisma` when needed.

## Architecture

The full technical write-up — architecture diagram, every important file and what
calls it, the complete API reference, the knowledge-ingestion and Ask TraceMind data
flows, exactly how a Decision's traceability graph (People ↔ Decisions ↔ Knowledge ↔
Evidence ↔ Timeline) fits together, and a guide to where to make common changes — lives
in **[ARCHITECTURE.md](./ARCHITECTURE.md)**.
