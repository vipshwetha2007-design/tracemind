import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, User } from "lucide-react";
import { getDecisionDetail } from "@/lib/queries";
import StatusBadge from "@/components/shared/StatusBadge";
import Avatar from "@/components/shared/Avatar";
import DecisionTrail from "@/components/decisions/DecisionTrail";
import { formatLongDate, formatDate } from "@/lib/format";

// No generateStaticParams here: decisions are created dynamically (by the
// AI knowledge-ingestion flow), so this route renders on demand for
// whatever id is requested, rather than being pre-built at compile time.

export default async function DecisionDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decision = await getDecisionDetail(id);

  if (!decision) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/decisions"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Decisions
      </Link>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {decision.title}
          </h2>
          <StatusBadge status={decision.status} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatLongDate(decision.date)}
          </span>
          {decision.ownerName && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              Decision owner: {decision.ownerName}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="What was decided?">
          <p className="text-sm leading-relaxed text-muted">
            {decision.whatDescription}
          </p>
        </Section>

        <Section title="Why was it decided?">
          <p className="text-sm leading-relaxed text-muted">
            {decision.whyDescription}
          </p>
        </Section>
      </div>

      <Section title="Outcome" className="mt-6">
        {decision.outcome ? (
          <p className="text-sm leading-relaxed text-muted">{decision.outcome}</p>
        ) : (
          <p className="text-sm italic text-muted">
            No outcome recorded yet — this decision is still being carried out or
            reviewed.
          </p>
        )}
      </Section>

      <Section title="Who was involved?" className="mt-6">
        {decision.involvedPeople.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {decision.involvedPeople.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-background"
              >
                <Avatar initials={person.initials} seed={person.id} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {person.name}
                  </p>
                  <p className="truncate text-xs text-muted">{person.role}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No participants recorded.</p>
        )}
      </Section>

      <Section title="Evidence" className="mt-6">
        <div className="space-y-3">
          {decision.evidence.map((item) => (
            <div
              key={item.knowledgeSource.id}
              className="rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.knowledgeSource.title}
                  </p>
                  <p className="text-xs text-muted">
                    {item.knowledgeSource.type} &middot; {formatDate(item.knowledgeSource.date)}
                  </p>
                </div>
              </div>
              {item.excerpt && (
                <p className="mt-2 border-l-2 border-accent/30 pl-3 text-sm italic leading-relaxed text-muted">
                  &ldquo;{item.excerpt}&rdquo;
                </p>
              )}
            </div>
          ))}
          {decision.evidence.length === 0 && (
            <p className="text-sm text-muted">No evidence attached yet.</p>
          )}
        </div>
      </Section>

      <Section title="Decision Trail" className="mt-6">
        {decision.trail.length > 0 ? (
          <DecisionTrail steps={decision.trail} />
        ) : (
          <p className="text-sm text-muted">No trail recorded yet.</p>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-6 shadow-sm ${className}`}
    >
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      {children}
    </div>
  );
}
