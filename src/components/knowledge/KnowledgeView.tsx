"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import KnowledgeCard from "@/components/knowledge/KnowledgeCard";
import type { KnowledgeSource } from "@/types";

type Filter = "All" | "Documents" | "Meetings";

const FILTERS: Filter[] = ["All", "Documents", "Meetings"];

/**
 * The interactive Knowledge list. The page (src/app/knowledge/page.tsx) is
 * a Server Component that fetches every knowledge source from the
 * database; this Client Component owns only the type-filter UI state.
 */
export default function KnowledgeView({ sources }: { sources: KnowledgeSource[] }) {
  const [filter, setFilter] = useState<Filter>("All");

  const filteredSources = useMemo(() => {
    return sources.filter((source) => {
      if (filter === "Documents") return source.type === "Document";
      if (filter === "Meetings") return source.type === "Meeting";
      return true;
    });
  }, [sources, filter]);

  return (
    <div>
      <PageHeader
        title="Knowledge"
        subtitle="Documents and meeting notes that form your institutional memory."
        action={
          <Link
            href="/knowledge/add"
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Add Knowledge
          </Link>
        }
      />

      <div className="mb-6 flex items-center gap-2">
        {FILTERS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === option
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {filteredSources.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSources.map((source) => (
            <KnowledgeCard key={source.id} source={source} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-sm text-muted">
            {sources.length === 0
              ? "No knowledge sources yet."
              : "No knowledge sources match this filter."}
          </p>
        </div>
      )}
    </div>
  );
}
