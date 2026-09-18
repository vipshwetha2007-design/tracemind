import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPersonDetail } from "@/lib/queries";
import Avatar from "@/components/shared/Avatar";
import StatusBadge from "@/components/shared/StatusBadge";
import ActivityFeed from "@/components/dashboard/ActivityFeed";

// No generateStaticParams: people are created dynamically as knowledge is
// ingested, so this route renders on demand.

export default async function PersonDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getPersonDetail(id);

  if (!detail) {
    notFound();
  }

  const { person, decisions, knowledgeSources, activity } = detail;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/people"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to People
      </Link>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-8 text-center shadow-sm sm:flex-row sm:items-center sm:text-left">
        <Avatar initials={person.initials} seed={person.id} size="lg" />
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {person.name}
          </h2>
          <p className="text-sm text-muted">
            {person.role} &middot; {person.department}
          </p>
        </div>
        <div className="flex gap-6 sm:ml-auto">
          <div className="text-center">
            <p className="text-xl font-semibold text-foreground">
              {decisions.length}
            </p>
            <p className="text-xs text-muted">Decisions</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-foreground">
              {knowledgeSources.length}
            </p>
            <p className="text-xs text-muted">Sources</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
          Decisions Involved In
        </h3>
        <div className="space-y-2">
          {decisions.map((decision) => (
            <Link
              key={decision.id}
              href={`/decisions/${decision.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-background"
            >
              <span className="truncate text-sm font-medium text-foreground">
                {decision.title}
              </span>
              <StatusBadge status={decision.status} />
            </Link>
          ))}
          {decisions.length === 0 && (
            <p className="text-sm text-muted">No decisions yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
          Knowledge Sources
        </h3>
        <div className="space-y-2">
          {knowledgeSources.map((source) => (
            <div
              key={source.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <span className="truncate text-sm font-medium text-foreground">
                {source.title}
              </span>
              <span className="shrink-0 text-xs text-muted">{source.type}</span>
            </div>
          ))}
          {knowledgeSources.length === 0 && (
            <p className="text-sm text-muted">No knowledge sources added yet.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
          Recent Activity
        </h3>
        {activity.length > 0 ? (
          <ActivityFeed activities={activity} />
        ) : (
          <p className="text-sm text-muted">No recent activity.</p>
        )}
      </div>
    </div>
  );
}
