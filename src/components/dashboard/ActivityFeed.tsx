import {
  CheckCircle2,
  Clock,
  Flag,
  FileText,
  PauseCircle,
  Paperclip,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Activity, ActivityType } from "@/types";

const TYPE_STYLES: Record<ActivityType, { icon: LucideIcon; className: string }> = {
  decision_approved: { icon: CheckCircle2, className: "bg-success-soft text-success" },
  decision_pending: { icon: Clock, className: "bg-warning-soft text-warning" },
  decision_deferred: { icon: PauseCircle, className: "bg-info-soft text-info" },
  decision_rejected: { icon: XCircle, className: "bg-danger-soft text-danger" },
  meeting_notes_added: { icon: FileText, className: "bg-accent-soft text-accent" },
  evidence_attached: { icon: Paperclip, className: "bg-accent-soft text-accent" },
  person_added: { icon: UserPlus, className: "bg-warning-soft text-warning" },
  milestone: { icon: Flag, className: "bg-background text-muted" },
};

/** Chronological feed of recent institutional activity, shown on the Overview dashboard. */
export default function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted">No activity yet.</p>;
  }

  return (
    <ul className="space-y-4">
      {activities.map((activity) => {
        const { icon: Icon, className } = TYPE_STYLES[activity.type];

        return (
          <li key={activity.id} className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${className}`}
            >
              <Icon className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-foreground">{activity.description}</p>
              <p className="mt-0.5 text-xs text-muted">
                {activity.personName ? `${activity.personName} · ` : ""}
                {activity.timestamp}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
