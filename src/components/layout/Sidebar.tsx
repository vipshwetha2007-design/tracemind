"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, X } from "lucide-react";
import { NAV_ITEMS, SETTINGS_ITEM } from "./nav-items";

interface SidebarProps {
  /** Whether the mobile drawer variant is open. Ignored on desktop. */
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

/**
 * Persistent left navigation rail, present on every page.
 *
 * Renders as a static column on medium+ screens, and as a slide-in drawer
 * (controlled by `mobileOpen`) on small screens.
 */
export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

  const content = (
    <>
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Compass className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold text-foreground">
              TraceMind
            </p>
            <p className="text-xs text-muted">Institutional Intelligence</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation"
          className="rounded-md p-1.5 text-muted hover:bg-background hover:text-foreground md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onCloseMobile}
          />
        ))}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <NavLink item={SETTINGS_ITEM} pathname={pathname} onNavigate={onCloseMobile} />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: static column */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        {content}
      </aside>

      {/* Mobile: overlay + drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-surface shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: { label: string; href: string; icon: typeof Compass };
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-accent-soft text-accent"
          : "text-muted hover:bg-background hover:text-foreground"
      }`}
    >
      <Icon
        className={`h-[18px] w-[18px] transition-colors ${
          isActive ? "text-accent" : "text-muted group-hover:text-foreground"
        }`}
        strokeWidth={2}
      />
      {item.label}
    </Link>
  );
}
