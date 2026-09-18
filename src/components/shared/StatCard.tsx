import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}

/** Summary metric card used on the Overview dashboard. */
export default function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {trend && <p className="mt-1 text-xs text-success">{trend}</p>}
    </div>
  );
}
