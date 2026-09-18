"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Decision, DecisionStatus } from "@/types";

const STATUS_ORDER: DecisionStatus[] = [
  "Approved",
  "Pending",
  "Deferred",
  "Rejected",
];

// Mirrors the semantic status colors used by StatusBadge, so the chart and
// the badges never disagree about what each color means.
const STATUS_COLOR: Record<DecisionStatus, string> = {
  Approved: "#059669",
  Pending: "#d97706",
  Deferred: "#2563eb",
  Rejected: "#dc2626",
};

interface TooltipPayload {
  active?: boolean;
  payload?: { payload: { status: string; count: number } }[];
}

function ChartTooltip({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const { status, count } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{status}</p>
      <p className="text-muted">
        {count} decision{count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

/** Bar chart summarizing decision counts by status, used on the Overview dashboard. */
export default function DecisionActivityChart({ decisions }: { decisions: Decision[] }) {
  const data = STATUS_ORDER.map((status) => ({
    status,
    count: decisions.filter((d) => d.status === status).length,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke="#e5e7eb" />
        <XAxis
          dataKey="status"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#6b7280", fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={24}
          tick={{ fill: "#6b7280", fontSize: 12 }}
        />
        <Tooltip cursor={{ fill: "#f7f8fb" }} content={<ChartTooltip />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLOR[entry.status]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
