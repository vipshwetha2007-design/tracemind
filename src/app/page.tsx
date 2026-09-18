import Link from "next/link";
import { BookOpen, CalendarClock, GitBranch, Users } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import DecisionCard from "@/components/decisions/DecisionCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import DecisionActivityChart from "@/components/dashboard/DecisionActivityChart";
import { getAllDecisions, getDashboardStats, getRecentActivity } from "@/lib/queries";

export default async function OverviewPage() {
  const [stats, allDecisions, activity] = await Promise.all([
    getDashboardStats(),
    getAllDecisions(),
    getRecentActivity(6),
  ]);
  const recentDecisions = allDecisions.slice(0, 3);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Good morning
        </h2>
        <p className="mt-1 text-sm text-muted">
          Here&apos;s what&apos;s happening across your institutional memory.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Decisions" value={stats.decisionCount} icon={GitBranch} />
        <StatCard
          label="Knowledge Sources"
          value={stats.knowledgeCount}
          icon={BookOpen}
        />
        <StatCard label="People" value={stats.personCount} icon={Users} />
        <StatCard
          label="Events"
          value={stats.eventCount}
          icon={CalendarClock}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              Recent Decisions
            </h3>
            <Link
              href="/decisions"
              className="text-sm font-medium text-accent hover:underline"
            >
              View all
            </Link>
          </div>
          {recentDecisions.length > 0 ? (
            <div className="space-y-4">
              {recentDecisions.map((decision) => (
                <DecisionCard key={decision.id} decision={decision} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
              <p className="text-sm text-muted">
                No decisions yet. Add a meeting note or document to get started.
              </p>
              <Link
                href="/knowledge/add"
                className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
              >
                Add Knowledge
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="text-base font-semibold text-foreground">
              Decision Activity
            </h3>
            <p className="mt-0.5 text-xs text-muted">By current status</p>
            <div className="mt-2">
              <DecisionActivityChart decisions={allDecisions} />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-foreground">
              Recent Activity
            </h3>
            <ActivityFeed activities={activity} />
          </div>
        </div>
      </div>
    </div>
  );
}
