# TraceMind

**Intelligent Institutional Memory & Decision Traceability Platform**

> **Don't just find information. Trace why it happened.**

---

## Problem

Organizations make important decisions through meetings, discussions, and documents.

Over time, the decision itself may be remembered, but the reasoning behind it often gets lost:

- Why was the decision made?
- Who was involved?
- What evidence supported it?
- What alternatives were considered?
- When did it happen?
- What happened afterward?

This information becomes scattered across meeting notes, documents, conversations, and people's memories.

TraceMind is designed to preserve this organizational reasoning as structured and traceable institutional memory.

---

## Solution

TraceMind converts unstructured organizational knowledge such as meeting notes and supported documents into structured institutional memory.

The core flow is:

```text
Knowledge
   ↓
AI Analysis
   ↓
Human Review
   ↓
Institutional Memory
   ↓
Decisions ↔ People ↔ Evidence ↔ Timeline
   ↓
Ask TraceMind
```

A user enters meeting notes or uploads a supported document.

Google Gemini analyzes the content and proposes structured information such as:

- People involved
- Decisions
- Reasoning
- Supporting evidence
- Summary
- Suggested action items

The AI output is **not automatically stored**.

A human first reviews the extracted information and explicitly approves it before it becomes part of TraceMind's institutional memory.

Later, users can ask questions such as:

> **"Why was this decision made?"**

TraceMind retrieves relevant information from the stored institutional memory and uses Gemini to generate a source-backed answer.

---

# MVP Features

## Overview Dashboard

The Overview Dashboard provides a database-backed summary of the organization's recorded institutional memory.

It displays information such as:

- Decisions
- Knowledge sources
- People
- Recent activity
- Timeline information

The dashboard reads from the same shared institutional-memory database used throughout TraceMind.

---

## Decisions

The Decisions module provides a structured view of organizational decisions.

A decision can contain:

- What was decided
- Why it was decided
- Who was involved
- When it happened
- Current status/outcome
- Supporting evidence
- Decision Trail

The Decision Trail helps users understand how a decision developed and connects the decision back to its supporting organizational knowledge.

---

## Knowledge

Knowledge is the primary ingestion point for new organizational information.

Users can:

- Enter meeting notes directly
- Upload `.txt` files
- Upload text-based PDF documents
- Analyze content using Gemini
- Review the AI-generated extraction
- Approve the extracted information
- Save approved information to institutional memory

For text-based PDFs, TraceMind uses `pdf-parse` to extract text already contained in the PDF.

### Important

**OCR is not implemented in the current MVP.**

Therefore, scanned documents, photographs, and image-only PDFs are not currently supported for automatic text extraction.

---

## AI-Assisted Knowledge Extraction

When the user selects **Analyze with AI**, TraceMind sends the provided textual content to the server-side Gemini integration.

Gemini helps identify structured information such as:

- Summary
- People
- Decisions
- Reasons
- Evidence
- Suggested action items

The extracted information is validated before being displayed for review.

---

## Human-in-the-Loop Review

TraceMind does not allow AI-generated information to automatically become institutional memory.

The process is:

```text
User Input
    ↓
Gemini Extraction
    ↓
Structured AI Output
    ↓
Human Review
    ↓
User Approval
    ↓
Database
```

The user can review the extraction before selecting:

**Save to Institutional Memory**

This helps prevent unreviewed AI output from automatically becoming an organizational record.

---

## People

The People module provides a person-centric view of institutional memory.

People can be connected with:

- Decisions
- Knowledge sources
- Organizational events

This allows users to understand who participated in important organizational decisions and which knowledge is associated with them.

---

## Timeline

The Timeline provides a chronological view of recorded organizational events.

While the Decisions module primarily explains:

**What happened and why?**

the Timeline additionally helps answer:

**When did it happen?**

This provides historical context around institutional decisions.

---

## Ask TraceMind

Ask TraceMind provides a natural-language interface for querying stored institutional memory.

For example:

> **Why was AWS selected for Project Atlas?**

Instead of sending the question directly to Gemini without organizational context, TraceMind first retrieves relevant stored information.

The flow is:

```text
User Question
      ↓
Relevant Information Retrieval
      ↓
Stored Institutional Context
      ↓
Gemini
      ↓
Source-backed Answer
```

The response can reference relevant decisions and supporting evidence.

### Current Retrieval Approach

The current MVP uses **keyword-based retrieval**.

It does **not** currently use:

- Vector databases
- Embeddings
- Semantic vector search

Semantic or hybrid retrieval can be introduced in a future version as the institutional knowledge base grows.

---

## Global Search

TraceMind provides global search across:

- Decisions
- People
- Knowledge

Global search operates directly on stored institutional information.

Normal global search does not require an AI call.

---

# System Architecture

TraceMind follows a layered architecture separating:

- User interface
- Backend/API processing
- AI processing
- Information retrieval
- Database access
- Persistent storage

## Architecture Diagram

<img width="1536" height="1024" alt="ChatGPT Image Sep 19, 2026, 03_00_51 PM" src="https://github.com/user-attachments/assets/8745902f-0153-4c51-af13-653db413ab82" />


The high-level architecture is:

```text
User
 │
 ▼
Next.js Application
 │
 ├───────────────┐
 ▼               ▼
API Routes    Server Queries
 │               │
 ├───────┐       │
 ▼       ▼       ▼
Gemini  Retrieval  Prisma ORM
 │       │          │
 └───────┴──────────┤
                    ▼
             PostgreSQL / Neon
```

---

# Knowledge Ingestion Architecture

New organizational knowledge follows this pipeline:

```text
Meeting Notes / TXT / Text-based PDF
                 ↓
        /api/knowledge/analyze
                 ↓
              Gemini
                 ↓
        Structured Extraction
                 ↓
            Human Review
                 ↓
            User Approval
                 ↓
         /api/knowledge/save
                 ↓
             Prisma ORM
                 ↓
         PostgreSQL / Neon
                 ↓
    Institutional Memory
                 ↓
 ┌─────────┬─────────┬─────────┐
 ▼         ▼         ▼         ▼
Decisions People  Evidence  Timeline
```

This separation ensures that AI extraction and permanent storage are two different operations.

---

# Ask TraceMind Architecture

Ask TraceMind follows this flow:

```text
User Question
      ↓
   /api/ask
      ↓
Retrieval Logic
      ↓
PostgreSQL / Neon
      ↓
Relevant Stored Context
      ↓
Google Gemini
      ↓
Source-backed Answer
```

The system retrieves organizational information before asking Gemini to formulate the final answer.

---

# Database Model

TraceMind's main institutional-memory entities are:

```text
Person
KnowledgeSource
Decision
DecisionParticipant
Evidence
TimelineEvent
```

Together, they create a traceability structure around organizational decisions.

A simplified relationship is:

```text
People
   ↕
DecisionParticipant
   ↕
Decisions
   ↕
Evidence
   ↕
Knowledge Sources
   ↕
Timeline
```

---

## Person

Represents a person participating in the organization's recorded institutional memory.

A person can be associated with multiple decisions and knowledge sources.

---

## KnowledgeSource

Represents the original organizational knowledge entered into TraceMind.

Examples include:

- Meeting notes
- TXT documents
- Text-based PDF documents

Knowledge sources provide the original context from which structured information is extracted.

---

## Decision

Represents an organizational decision identified and approved through the knowledge-ingestion process.

A decision can be connected with:

- Reasoning
- Participants
- Evidence
- Knowledge sources
- Timeline events

---

## DecisionParticipant

`DecisionParticipant` represents the relationship between a Person and a Decision.

This is required because:

- One person can participate in many decisions.
- One decision can involve many people.

---

## Evidence

Evidence connects a decision back to supporting knowledge.

This is an important part of TraceMind's traceability model because the system can show not only **what was decided**, but also the information supporting that decision.

---

## TimelineEvent

TimelineEvent represents chronological events in institutional memory.

It provides the time-based context needed to understand how organizational history developed.

---

# Important Project Files

## `prisma/schema.prisma`

Defines the PostgreSQL database models and relationships used by TraceMind.

If a new persistent field or entity is introduced, this is generally the first database-layer file that needs to be considered.

---

## `prisma/seed.ts`

Populates the database with realistic demonstration data.

This allows the application to be demonstrated and tested with existing institutional-memory records.

---

## `src/lib/prisma.ts`

Provides the shared Prisma client used by server-side application code to communicate with PostgreSQL.

The general database-access flow is:

```text
Application
    ↓
Prisma Client
    ↓
PostgreSQL / Neon
```

---

## `src/lib/queries.ts`

Contains centralized database read operations used by application pages.

Instead of repeating database queries across multiple pages, common database reads are maintained in this layer.

---

## `src/lib/gemini.ts`

Contains the server-side Google Gemini integration.

It is responsible for AI-related operations such as:

- Knowledge extraction
- Structured AI processing
- Question answering

Gemini credentials remain on the server and are not exposed to the browser.

---

## `src/lib/retrieval.ts`

Contains retrieval logic used to identify relevant institutional information.

The current MVP uses keyword-based retrieval.

This retrieved context is particularly important for Ask TraceMind.

---

# API Endpoints

## `POST /api/knowledge/analyze`

Analyzes meeting notes or supported documents.

Flow:

```text
Input
 ↓
Text Extraction
 ↓
Gemini
 ↓
Structured Result
 ↓
Human Review
```

This endpoint does **not** directly save AI-generated information into institutional memory.

---

## `POST /api/knowledge/save`

Saves human-approved extracted information.

It uses Prisma to persist institutional-memory data in PostgreSQL.

The saved information can include:

- Knowledge source
- People
- Decisions
- Decision participants
- Evidence
- Timeline events

---

## `POST /api/ask`

Handles Ask TraceMind questions.

The endpoint:

1. Receives the user's question.
2. Retrieves relevant stored information.
3. Builds contextual information for Gemini.
4. Requests an answer based on that context.
5. Returns the answer with relevant supporting information.

---

## `GET /api/search`

Provides global search across:

- Decisions
- People
- Knowledge

It operates on the structured institutional-memory data.

---

# Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| ORM | Prisma ORM |
| Database | PostgreSQL hosted on Neon |
| AI | Google Gemini |
| Validation | Zod |
| PDF Text Extraction | `pdf-parse` |
| Version Control | GitHub |
| Deployment | Vercel |

---

# Environment Variables

TraceMind requires environment variables similar to:

```env
DATABASE_URL="your_postgresql_connection_string"
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="your_gemini_model"
```

Never commit real credentials or API keys to the repository.

The real `.env` file should remain ignored by Git.

Only a placeholder `.env.example` should be committed.

---

# Running Locally

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Create/configure your local `.env` file with the required database and Gemini credentials.

## 3. Generate Prisma Client

```bash
npx prisma generate
```

## 4. Synchronize the database schema

```bash
npx prisma db push
```

## 5. Seed demonstration data if required

```bash
npm run seed
```

## 6. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# Supported Knowledge Input

The current MVP supports:

### Direct Text / Meeting Notes

Users can directly enter or paste textual meeting notes.

### TXT Documents

Plain-text `.txt` files can be processed.

### Text-Based PDFs

PDF files containing actual extractable text can be processed using `pdf-parse`.

### Not Supported: OCR

TraceMind does **not** currently perform Optical Character Recognition.

Therefore:

```text
Text-based PDF       → Supported
TXT                   → Supported
Meeting-note text     → Supported

Scanned PDF           → Not supported
Image-only PDF        → Not supported
Photograph            → Not supported
```

OCR can be introduced as a future document-ingestion enhancement.

---

# Current MVP Limitations

The current MVP does not implement:

- OCR for scanned/image-only documents
- Vector database / embeddings
- Authentication
- Multi-tenancy
- Complex role-based permissions
- Real-time collaboration
- Email/notification system

AI-detected action items can be displayed during the AI review process, but they are not currently persisted as a separate database entity.

These capabilities can be introduced as the platform evolves beyond the current MVP.

---

# Deployment

TraceMind's source code is maintained using GitHub.

The application is deployed through Vercel.

The production deployment architecture is:

```text
GitHub Repository
       ↓
     Vercel
       ↓
Next.js TraceMind Application
       │
       ├──────────────→ Google Gemini API
       │
       ▼
   Prisma ORM
       │
       ▼
PostgreSQL / Neon
```

Sensitive environment variables such as the database connection string and Gemini API key are configured through the deployment environment and are not stored directly in the public source-code repository.

---

# Future Enhancements

Possible future improvements include:

- OCR support for scanned documents
- Semantic retrieval using embeddings
- Vector or hybrid search
- Authentication
- Role-based access control
- Multi-organization support
- Improved document-format support
- Persistent action-item management
- Real-time collaboration
- Notification workflows
- More advanced decision analytics

---

# Core Idea

TraceMind is not simply a document-search application.

Traditional search helps answer:

> **"Where is this information?"**

TraceMind is designed to help answer:

> **"Why did this happen?"**

It preserves organizational reasoning by connecting:

```text
People
  ↓
Knowledge
  ↓
Decisions
  ↓
Reasons
  ↓
Evidence
  ↓
Timeline
```

## **Don't just find information. Trace why it happened.**
