import Link from "next/link";
import type { Person } from "@/types";
import Avatar from "@/components/shared/Avatar";

/** A single person's summary card, shown on the People directory page. */
export default function PersonCard({ person }: { person: Person }) {
  return (
    <Link
      href={`/people/${person.id}`}
      className="block rounded-xl border border-border bg-surface p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <Avatar
        initials={person.initials}
        seed={person.id}
        size="lg"
        className="mx-auto"
      />
      <p className="mt-3 text-[15px] font-semibold text-foreground">
        {person.name}
      </p>
      <p className="text-sm text-muted">{person.role}</p>
      <p className="mt-0.5 text-xs text-muted">{person.department}</p>

      <div className="mt-4 flex items-center justify-center gap-4 border-t border-border pt-4 text-xs text-muted">
        <span>
          <span className="font-semibold text-foreground">
            {person.decisionIds.length}
          </span>{" "}
          decision{person.decisionIds.length === 1 ? "" : "s"}
        </span>
        <span>
          <span className="font-semibold text-foreground">
            {person.knowledgeIds.length}
          </span>{" "}
          source{person.knowledgeIds.length === 1 ? "" : "s"}
        </span>
      </div>
    </Link>
  );
}
