"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, FileText, Loader2, Sparkles } from "lucide-react";
import type { AskResponse } from "@/types";

const SUGGESTED_QUESTIONS = [
  "Why did we choose PostgreSQL?",
  "Who approved the mobile release delay?",
  "What decisions were made this month?",
  "Show decisions involving Arjun Raman.",
];

export default function AskTraceMindPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AskResponse | null>(null);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setQuery(trimmed);
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong answering this question.");
        return;
      }
      setResponse(data as AskResponse);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    ask(query);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Sparkles className="h-6 w-6" strokeWidth={2.25} />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Ask TraceMind
        </h2>
        <p className="mt-1 text-sm text-muted">
          Ask questions about your organization&apos;s decisions and history.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2 shadow-sm transition-colors focus-within:border-accent/40">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask why a decision was made, who was involved, or what happened..."
            disabled={loading}
            className="w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Ask"
            disabled={loading || query.trim().length === 0}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>

      {!loading && !response && !error && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => ask(question)}
              className="rounded-xl border border-border bg-surface p-4 text-left text-sm font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
          <p className="mt-3 text-sm text-muted">
            Searching institutional memory and asking Gemini...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {response && !loading && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {response.hasSufficientEvidence ? (
            <span className="inline-block rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
              Answered from institutional memory
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">
              <AlertTriangle className="h-3.5 w-3.5" />
              Insufficient evidence
            </span>
          )}

          <p className="mt-4 text-sm font-semibold text-foreground">{query}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{response.answer}</p>

          {response.sources.length > 0 && (
            <div className="mt-5 border-t border-border pt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Sources used
              </p>
              <div className="space-y-2">
                {response.sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted" />
                    {source.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {response.relatedDecisions.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Related Decision
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {response.relatedDecisions[0].title}
                </p>
              </div>
              <Link
                href={`/decisions/${response.relatedDecisions[0].id}`}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                View Decision Trail
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
