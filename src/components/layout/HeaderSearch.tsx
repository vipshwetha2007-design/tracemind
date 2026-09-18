"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { FileText, GitBranch, Search, Users } from "lucide-react";
import type { SearchResults } from "@/types";

const EMPTY_RESULTS: SearchResults = { decisions: [], people: [], knowledge: [] };

/**
 * The command-style search field in the top header. Debounces input, calls
 * GET /api/search, and shows grouped results (Decisions / People /
 * Knowledge) in a dropdown. Selecting a result navigates to its page.
 */
export default function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      // Nothing to search — the dropdown is hidden for an empty query
      // anyway (see showDropdown below), so there's nothing to synchronize
      // here. Clearing is instead handled directly in the event handlers
      // that empty the query (see handleQueryChange and go()).
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          setResults(await res.json());
        }
      } catch {
        // A failed search shouldn't break the header — just show no results.
        setResults(EMPTY_RESULTS);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  function go(path: string) {
    setOpen(false);
    setQuery("");
    setResults(EMPTY_RESULTS);
    router.push(path);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim().length === 0) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
    } else {
      // Signal "searching" immediately on keystroke, in this direct event
      // handler, rather than as a synchronous setState inside the debounce
      // effect below.
      setLoading(true);
    }
  }

  const hasResults =
    results.decisions.length > 0 || results.people.length > 0 || results.knowledge.length > 0;
  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative ml-2 hidden flex-1 max-w-md sm:block">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted transition-colors focus-within:border-accent/40 focus-within:bg-surface">
        <Search className="h-4 w-4 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search decisions, people, documents..."
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
        <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted lg:inline-block">
          &#8984;K
        </kbd>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-lg">
          {loading && <p className="px-3 py-4 text-center text-sm text-muted">Searching...</p>}

          {!loading && !hasResults && (
            <p className="px-3 py-4 text-center text-sm text-muted">
              No results for &ldquo;{query}&rdquo;.
            </p>
          )}

          {!loading && results.decisions.length > 0 && (
            <ResultGroup label="Decisions">
              {results.decisions.map((d) => (
                <ResultRow key={d.id} icon={GitBranch} label={d.title} sublabel={d.status} onClick={() => go(`/decisions/${d.id}`)} />
              ))}
            </ResultGroup>
          )}

          {!loading && results.people.length > 0 && (
            <ResultGroup label="People">
              {results.people.map((p) => (
                <ResultRow key={p.id} icon={Users} label={p.name} sublabel={p.role} onClick={() => go(`/people/${p.id}`)} />
              ))}
            </ResultGroup>
          )}

          {!loading && results.knowledge.length > 0 && (
            <ResultGroup label="Knowledge">
              {results.knowledge.map((k) => (
                <ResultRow key={k.id} icon={FileText} label={k.title} sublabel={k.type} onClick={() => go("/knowledge")} />
              ))}
            </ResultGroup>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ResultRow({
  icon: Icon,
  label,
  sublabel,
  onClick,
}: {
  icon: typeof Search;
  label: string;
  sublabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-background"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted" />
      <span className="truncate">{label}</span>
      <span className="ml-auto shrink-0 text-xs text-muted">{sublabel}</span>
    </button>
  );
}
