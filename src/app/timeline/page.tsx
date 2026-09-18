import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
import { getTimelineEvents } from "@/lib/queries";
import {
  TIMELINE_TYPE_COLOR,
  TIMELINE_TYPE_ICON,
  TIMELINE_TYPE_LABEL,
} from "@/lib/timeline-icons";

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
}

export default async function TimelinePage() {
  const sortedEvents = await getTimelineEvents(); // already ordered eventDate desc

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Timeline"
        subtitle="A chronological record of meetings, documents, decisions, and events across the organization."
      />

      {sortedEvents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-sm text-muted">No timeline events yet.</p>
        </div>
      ) : (
        <ol className="relative">
          {sortedEvents.map((event, index) => {
            const Icon = TIMELINE_TYPE_ICON[event.type];
            const isLast = index === sortedEvents.length - 1;
            const content = (
              <div className="rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow group-hover:shadow-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">
                    {TIMELINE_TYPE_LABEL[event.type]}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {event.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {event.description}
                </p>
              </div>
            );

            return (
              <li key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                {!isLast && (
                  <span
                    className="absolute left-[19px] top-16 h-[calc(100%-2.5rem)] w-px bg-border"
                    aria-hidden="true"
                  />
                )}

                <div className="flex w-12 shrink-0 flex-col items-center pt-1">
                  <span className="text-xs font-medium text-muted">
                    {formatDay(event.date)}
                  </span>
                  <span
                    className={`mt-2 flex h-9 w-9 items-center justify-center rounded-full border-2 ${TIMELINE_TYPE_COLOR[event.type]}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </div>

                {event.decisionId ? (
                  <Link href={`/decisions/${event.decisionId}`} className="group flex-1">
                    {content}
                  </Link>
                ) : (
                  <div className="flex-1">{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
