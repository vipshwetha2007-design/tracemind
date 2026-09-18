import Link from "next/link";
import { CalendarDays, FileText } from "lucide-react";
import type { Decision } from "@/types";
import StatusBadge from "@/components/shared/StatusBadge";
import Avatar from "@/components/shared/Avatar";
import { formatDate } from "@/lib/format";

/**
 * A single decision, summarized so the WHAT / WHY / WHO / WHEN are all
 * visible without opening the detail page. Reused on the Overview
 * dashboard ("Recent Decisions") and the full Decisions list.
 */
export default function DecisionCard({ decision }: { decision: Decision }) {
  return (
    <Link
      href={`/decisions/${decision.id}`}
      className="block rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold leading-snug text-foreground">
          {decision.title}
        </h3>
        <StatusBadge status={decision.status} />
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted">
        {decision.reason}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(decision.date)}
        </span>

        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {decision.evidenceIds.length} evidence source
          {decision.evidenceIds.length === 1 ? "" : "s"}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex -space-x-2">
            {decision.people.slice(0, 4).map((person) => (
              <Avatar
                key={person.id}
                initials={person.initials}
                seed={person.id}
                size="sm"
                className="ring-2 ring-surface"
              />
            ))}
          </div>
          {decision.ownerName && (
            <span className="hidden sm:inline">Owner: {decision.ownerName}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
