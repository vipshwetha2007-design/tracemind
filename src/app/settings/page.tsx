import { Bell, Palette, Shield, User } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

const SETTINGS_SECTIONS = [
  {
    icon: User,
    title: "Profile",
    description: "Name, role, and how you appear across TraceMind.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Choose which activity you're notified about.",
  },
  {
    icon: Shield,
    title: "Access & Permissions",
    description: "Control who can view and edit institutional records.",
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Theme and display preferences.",
  },
];

/**
 * Stage 1: a UI-only settings placeholder. No account/auth backend exists
 * yet, so there is nothing functional to configure here — this establishes
 * the layout for later stages.
 */
export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Manage your TraceMind preferences."
      />

      <div className="space-y-3">
        {SETTINGS_SECTIONS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Settings are not yet functional in Stage 1 — this page shows the
        planned layout only.
      </p>
    </div>
  );
}
