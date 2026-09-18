import {
  LayoutDashboard,
  GitBranch,
  BookOpen,
  Users,
  History,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";

/** A single entry in the sidebar navigation. */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * The primary sidebar navigation. Shared by the Sidebar (to render the
 * links) and the Header (to derive the current page title from the active
 * route), so the two never fall out of sync.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Decisions", href: "/decisions", icon: GitBranch },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "People", href: "/people", icon: Users },
  { label: "Timeline", href: "/timeline", icon: History },
  { label: "Ask TraceMind", href: "/ask", icon: Sparkles },
];

/** Rendered separately at the bottom of the sidebar. */
export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
};

/**
 * Resolves the page title shown in the top header for a given pathname.
 * Falls back gracefully for nested/dynamic routes (e.g. a decision detail
 * page still reports "Decisions" as its section).
 */
export function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Overview";
  const allItems = [...NAV_ITEMS, SETTINGS_ITEM];
  const match = allItems.find(
    (item) => item.href !== "/" && pathname.startsWith(item.href)
  );
  return match?.label ?? "Overview";
}
