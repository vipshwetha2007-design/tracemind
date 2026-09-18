import { FileText, Users2 } from "lucide-react";
import type { KnowledgeSource } from "@/types";
import { formatDate } from "@/lib/format";

/** A single document or meeting card, shown on the Knowledge page. */
export default function KnowledgeCard({ source }: { source: KnowledgeSource }) {
  const Icon = source.type === "Document" ? FileText : Users2;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-foreground">
            {source.title}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {source.type} &middot; {formatDate(source.date)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted">
        <span>Added by {source.addedByName ?? "TraceMind AI ingestion"}</span>
        <span className="rounded-full bg-background px-2 py-1 font-medium text-foreground">
          {source.linkedDecisionIds.length} linked decision
          {source.linkedDecisionIds.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
