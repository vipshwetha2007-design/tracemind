import { Calendar, FileText, GitCommitVertical, Users, type LucideIcon } from "lucide-react";
import type { TimelineEventType } from "@/types";

/**
 * Single source of truth for how each kind of timeline entry is
 * represented visually. Shared by the Decision Trail (decision detail
 * page) and the institutional Timeline page so the same event type always
 * reads the same way anywhere in the app.
 */
export const TIMELINE_TYPE_ICON: Record<TimelineEventType, LucideIcon> = {
  event: GitCommitVertical,
  meeting: Users,
  document: FileText,
  decision: Calendar,
};

export const TIMELINE_TYPE_LABEL: Record<TimelineEventType, string> = {
  event: "Event",
  meeting: "Meeting",
  document: "Document",
  decision: "Decision",
};

export const TIMELINE_TYPE_COLOR: Record<TimelineEventType, string> = {
  event: "border-border bg-surface text-muted",
  meeting: "border-info/30 bg-info-soft text-info",
  document: "border-accent/30 bg-accent-soft text-accent",
  decision: "border-success/30 bg-success-soft text-success",
};
