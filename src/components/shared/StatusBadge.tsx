import { CheckCircle2, Clock, PauseCircle, XCircle } from "lucide-react";
import type { DecisionStatus } from "@/types";

const STATUS_STYLES: Record<
  DecisionStatus,
  { icon: typeof CheckCircle2; className: string }
> = {
  Approved: {
    icon: CheckCircle2,
    className: "bg-success-soft text-success",
  },
  Pending: {
    icon: Clock,
    className: "bg-warning-soft text-warning",
  },
  Deferred: {
    icon: PauseCircle,
    className: "bg-info-soft text-info",
  },
  Rejected: {
    icon: XCircle,
    className: "bg-danger-soft text-danger",
  },
};

/** Small colored pill communicating a decision's status at a glance. */
export default function StatusBadge({ status }: { status: DecisionStatus }) {
  const { icon: Icon, className } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      {status}
    </span>
  );
}
