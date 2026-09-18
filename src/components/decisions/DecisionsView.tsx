"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import DecisionCard from "@/components/decisions/DecisionCard";
import type { Decision, DecisionStatus } from "@/types";

type StatusFilter = "All" | DecisionStatus;
type DateFilter = "All time" | "Last 30 days" | "Last 90 days" | "This year";

const STATUS_OPTIONS: StatusFilter[] = [
  "All",
  "Approved",
  "Pending",
  "Deferred",
  "Rejected",
];

const DATE_OPTIONS: DateFilter[] = [
  "All time",
  "Last 30 days",
  "Last 90 days",
  "This year",
];

/**
 * The interactive Decisions list: search, status/date filters, and cards.
 * The page itself (src/app/decisions/page.tsx) is a Server Component that
 * fetches every decision from the database; this Client Component owns
 * only the filtering UI state, operating on the already-loaded list.
 */
export default function DecisionsView({ decisions }: { decisions: Decision[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All time");

  // The dataset is historical demo/ingested data, not tied to "today", so
  // date filters are computed relative to the most recent decision rather
  // than the real current date — this keeps "Last 30 days" meaningful
  // regardless of when the app is opened.
  const referenceDate = useMemo(() => {
    if (decisions.length === 0) return new Date();
    return new Date(Math.max(...decisions.map((d) => new Date(d.date).getTime())));
  }, [decisions]);

  function withinDateFilter(dateIso: string, filter: DateFilter): boolean {
    if (filter === "All time") return true;
    const date = new Date(dateIso);
    const daysAgo = (referenceDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (filter === "Last 30 days") return daysAgo <= 30;
    if (filter === "Last 90 days") return daysAgo <= 90;
    if (filter === "This year") return date.getFullYear() === referenceDate.getFullYear();
    return true;
  }

  const filteredDecisions = useMemo(() => {
    return decisions
      .filter((d) => status === "All" || d.status === status)
      .filter((d) => withinDateFilter(d.date, dateFilter))
      .filter((d) =>
        query.trim().length === 0
          ? true
          : d.title.toLowerCase().includes(query.trim().toLowerCase()) ||
            d.reason.toLowerCase().includes(query.trim().toLowerCase())
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisions, query, status, dateFilter, referenceDate]);

  return (
    <div>
      <PageHeader
        title="Decisions"
        subtitle="Track what was decided, why it was decided, and the evidence behind it."
        action={
          <Link
            href="/knowledge/add"
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            New Decision
          </Link>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted focus-within:border-accent/40">
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search decisions by title or reason..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/40 focus:outline-none"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All statuses" : option}
            </option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent/40 focus:outline-none"
        >
          {DATE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {filteredDecisions.length > 0 ? (
        <div className="space-y-4">
          {filteredDecisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-sm text-muted">
            {decisions.length === 0
              ? "No decisions yet. Add a meeting note or document to get started."
              : "No decisions match your filters."}
          </p>
        </div>
      )}
    </div>
  );
}
