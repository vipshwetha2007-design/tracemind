"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import type { ExtractionResult } from "@/lib/gemini";
import type { DecisionStatus } from "@/types";

type SourceType = "Meeting" | "Document";
type Step = "form" | "analyzing" | "review" | "saving" | "success";

interface AnalyzeResponse {
  title: string;
  type: SourceType;
  date: string;
  fileName: string | null;
  content: string;
  extraction: ExtractionResult | null;
  warning?: string;
}

interface SaveResponse {
  knowledgeSourceId: string;
  decisionIds: string[];
}

/**
 * Add Knowledge: the human-in-the-loop AI ingestion flow.
 *
 *   1. "form"      — user provides meeting notes or uploads a PDF/TXT file.
 *   2. "analyzing"  — POST /api/knowledge/analyze; Gemini extracts structure.
 *   3. "review"     — "AI Extraction Review": the user sees exactly what the
 *                      AI detected before anything is saved.
 *   4. "saving"     — POST /api/knowledge/save, only once the user approves.
 *   5. "success"    — links to the new knowledge source / decision(s).
 */
export default function AddKnowledgePage() {
  const [step, setStep] = useState<Step>("form");
  const [sourceType, setSourceType] = useState<SourceType>("Meeting");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setStep("form");
    setTitle("");
    setDate("");
    setContent("");
    setFile(null);
    setError(null);
    setAnalysis(null);
    setSaveResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (sourceType === "Meeting" && content.trim().length < 20) {
      setError("Please enter at least a couple of sentences of meeting notes.");
      return;
    }
    if (sourceType === "Document" && !file) {
      setError("Please attach a PDF or TXT file.");
      return;
    }

    const formData = new FormData();
    formData.set("type", sourceType);
    formData.set("title", title.trim() || (file ? file.name : "Untitled"));
    if (date) formData.set("date", new Date(date).toISOString());
    if (sourceType === "Meeting") {
      formData.set("content", content);
    } else if (file) {
      formData.set("file", file);
    }

    setStep("analyzing");
    try {
      const res = await fetch("/api/knowledge/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong while analyzing this content.");
        setStep("form");
        return;
      }
      setAnalysis(data as AnalyzeResponse);
      setStep("review");
    } catch {
      setError("Could not reach the server. Please try again.");
      setStep("form");
    }
  }

  async function handleSave() {
    if (!analysis) return;
    setError(null);
    setStep("saving");
    try {
      const res = await fetch("/api/knowledge/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysis),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong while saving.");
        setStep("review");
        return;
      }
      setSaveResult(data as SaveResponse);
      setStep("success");
    } catch {
      setError("Could not reach the server. Please try again.");
      setStep("review");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/knowledge"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Knowledge
      </Link>

      <PageHeader
        title="Add Knowledge"
        subtitle="Add meeting notes or a document. AI will suggest the decisions, people, and reasoning inside it — you review and approve before anything is saved."
      />

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {(step === "form" || step === "analyzing") && (
        <form onSubmit={handleAnalyze} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-5 flex gap-2">
            {(["Meeting", "Document"] as SourceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSourceType(type)}
                disabled={step === "analyzing"}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  sourceType === type
                    ? "border-accent/30 bg-accent-soft text-accent"
                    : "border-border text-muted hover:bg-background"
                }`}
              >
                {type === "Meeting" ? "Meeting Notes" : "Document"}
              </button>
            ))}
          </div>

          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={sourceType === "Meeting" ? "e.g. Q4 Planning Meeting" : "Leave blank to use the file name"}
              disabled={step === "analyzing"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
            />
          </label>

          {sourceType === "Meeting" ? (
            <>
              <label className="mb-4 block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Date</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={step === "analyzing"}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent/40 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">Meeting notes</span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={step === "analyzing"}
                  rows={10}
                  placeholder="Paste or write the meeting notes here..."
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
                />
              </label>
            </>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">File (PDF or TXT, up to 5MB)</span>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-background px-4 py-6">
                <Upload className="h-5 w-5 shrink-0 text-muted" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={step === "analyzing"}
                  className="w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent"
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                Text-based PDFs are supported. Scanned documents require OCR and are outside the current MVP.
              </p>
            </label>
          )}

          <button
            type="submit"
            disabled={step === "analyzing"}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {step === "analyzing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze with AI
              </>
            )}
          </button>
        </form>
      )}

      {(step === "review" || step === "saving") && analysis && (
        <ExtractionReview
          analysis={analysis}
          saving={step === "saving"}
          onSave={handleSave}
          onDiscard={resetForm}
        />
      )}

      {step === "success" && saveResult && (
        <SuccessPanel saveResult={saveResult} onAddAnother={resetForm} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Extraction Review
// ---------------------------------------------------------------------------

function ExtractionReview({
  analysis,
  saving,
  onSave,
  onDiscard,
}: {
  analysis: AnalyzeResponse;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const extraction = analysis.extraction;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2.5 rounded-lg border border-accent/20 bg-accent-soft px-4 py-3 text-sm text-accent">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          AI Extraction Review — this is what Gemini detected in &ldquo;{analysis.title}&rdquo;.
          Nothing has been saved yet. Review it, then approve to add it to institutional memory.
        </p>
      </div>

      {analysis.warning && (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{analysis.warning}</p>
        </div>
      )}

      {extraction && (
        <>
          <ReviewSection title="Summary">
            <p className="text-sm leading-relaxed text-muted">
              {extraction.summary || "No summary was generated."}
            </p>
          </ReviewSection>

          <ReviewSection title={`People Detected (${extraction.people.length})`}>
            {extraction.people.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {extraction.people.map((person, i) => (
                  <span
                    key={`${person.name}-${i}`}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                  >
                    <Users className="h-3.5 w-3.5 text-muted" />
                    {person.name}
                    {person.role && <span className="text-muted">&middot; {person.role}</span>}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No people detected.</p>
            )}
          </ReviewSection>

          <ReviewSection title={`Decisions Detected (${extraction.decisions.length})`}>
            {extraction.decisions.length > 0 ? (
              <div className="space-y-3">
                {extraction.decisions.map((decision, i) => (
                  <div key={i} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">{decision.title}</p>
                      <StatusBadge status={decision.status as DecisionStatus} />
                    </div>
                    {decision.summary && (
                      <p className="mt-2 text-sm text-muted">
                        <span className="font-medium text-foreground">What: </span>
                        {decision.summary}
                      </p>
                    )}
                    {decision.reason && (
                      <p className="mt-1 text-sm text-muted">
                        <span className="font-medium text-foreground">Why: </span>
                        {decision.reason}
                      </p>
                    )}
                    {decision.participants.length > 0 && (
                      <p className="mt-1 text-sm text-muted">
                        <span className="font-medium text-foreground">Participants: </span>
                        {decision.participants.join(", ")}
                      </p>
                    )}
                    {decision.evidenceExcerpt && (
                      <p className="mt-2 border-l-2 border-accent/30 pl-3 text-sm italic text-muted">
                        &ldquo;{decision.evidenceExcerpt}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                No decisions were detected in this content. You can still save it as a
                knowledge source for future reference.
              </p>
            )}
          </ReviewSection>

          <ReviewSection title={`Action Items (${extraction.actionItems.length})`}>
            {extraction.actionItems.length > 0 ? (
              <ul className="space-y-2">
                {extraction.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                    <span className="text-foreground">{item.task}</span>
                    <span className="shrink-0 text-right text-xs text-muted">
                      {item.owner || "Unassigned"}
                      {item.dueDate ? ` · ${item.dueDate}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No action items detected.</p>
            )}
            <p className="mt-3 text-xs text-muted">
              Shown for context only — action items aren&apos;t persisted in this MVP.
            </p>
          </ReviewSection>
        </>
      )}

      {!extraction && (
        <ReviewSection title="Raw content">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {analysis.content.slice(0, 1000)}
            {analysis.content.length > 1000 ? "..." : ""}
          </p>
        </ReviewSection>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Save to Institutional Memory
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onDiscard}
          disabled={saving}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-70"
        >
          Discard &amp; Start Over
        </button>
      </div>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success
// ---------------------------------------------------------------------------

function SuccessPanel({
  saveResult,
  onAddAnother,
}: {
  saveResult: SaveResponse;
  onAddAnother: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Saved to institutional memory</h3>
      <p className="mt-1 text-sm text-muted">
        {saveResult.decisionIds.length > 0
          ? `${saveResult.decisionIds.length} decision${saveResult.decisionIds.length === 1 ? "" : "s"} added, with evidence linked back to this source.`
          : "This source is now searchable in Ask TraceMind and visible on the Timeline."}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/knowledge"
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
        >
          <FileText className="h-4 w-4" />
          View Knowledge
        </Link>
        {saveResult.decisionIds.length > 0 && (
          <Link
            href={`/decisions/${saveResult.decisionIds[0]}`}
            className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
          >
            View Decision Trail
          </Link>
        )}
        <button
          type="button"
          onClick={onAddAnother}
          className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-background"
        >
          Add Another
        </button>
      </div>
    </div>
  );
}
