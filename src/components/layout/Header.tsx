"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { getPageTitle } from "./nav-items";
import HeaderSearch from "./HeaderSearch";

interface HeaderProps {
  onOpenMobileNav: () => void;
}

/** Top header: current page title, command-style search, notifications, avatar. */
export default function Header({ onOpenMobileNav }: HeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="rounded-md p-1.5 text-muted hover:bg-background hover:text-foreground md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="shrink-0 text-[17px] font-semibold text-foreground">
        {title}
      </h1>

      <HeaderSearch />

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-label="View notifications"
          className="relative rounded-lg p-2 text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          SV
        </div>
      </div>
    </header>
  );
}
