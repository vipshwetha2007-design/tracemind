import type { DecisionTrailStep } from "@/types";
import { TIMELINE_TYPE_ICON } from "@/lib/timeline-icons";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Vertical "decision trail" timeline — the centerpiece of the Decision
 * Detail page. Walks from the problem being identified through to the
 * final decision, making the traceability story visible at a glance.
 */
export default function DecisionTrail({ steps }: { steps: DecisionTrailStep[] }) {
  return (
    <ol className="relative">
      {steps.map((step, index) => {
        const Icon = TIMELINE_TYPE_ICON[step.type];
        const isLast = index === steps.length - 1;

        return (
          <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className="absolute left-[15px] top-8 h-[calc(100%-1.25rem)] w-px bg-border"
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                isLast
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-surface text-muted"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
            </span>

            <div className="pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {step.title}
                </p>
                <span className="text-xs text-muted">
                  {formatDate(step.date)}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
