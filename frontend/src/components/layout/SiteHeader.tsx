"use client";

import * as React from "react";
import { IconArrowUpRight, IconSearch } from "@tabler/icons-react";
import { HamburgerMenu } from "@/components/wensity/animated-hamburger-menu";
import { Kbd } from "@/components/wensity/kbd";
import { Marker } from "@/components/wensity/marker";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/wensity/sheet";
import {
  persistTheme,
  readCurrentTheme,
  type ThemeMode,
} from "@/lib/theme";

export interface SiteHeaderProps {
  activeModelId?: string | null;
  apiStatus: "live" | "connecting" | "offline";
  docsUrl: string;
  onOpenCommand: () => void;
  onJumpToWorkspace: () => void;
}

const NAV_LINKS = [
  { href: "#top", label: "Overview" },
  { href: "#workspace", label: "Workspace" },
  { href: "#architecture", label: "Architecture" },
  { href: "#methodology", label: "Methodology" },
];

export function SiteHeader({
  activeModelId,
  apiStatus,
  docsUrl,
  onOpenCommand,
  onJumpToWorkspace,
}: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<ThemeMode>("light");
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    setTheme(readCurrentTheme());
  }, []);

  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleToggleTheme() {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    persistTheme(next);
  }

  return (
    <>
      <header
        className={[
          "sticky top-0 z-[var(--z-sticky)] border-b transition-colors duration-150",
          scrolled
            ? "border-[var(--cv-border)] bg-[color-mix(in_srgb,var(--cv-surface)_90%,transparent)] backdrop-blur-md"
            : "border-transparent bg-[var(--cv-surface)]",
        ].join(" ")}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 min-w-0">
            <a
              href="#top"
              className="flex items-center gap-2.5 min-w-0 shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cv-accent)]"
              aria-label="Curavex home"
            >
              <img
                src="./assets/curavex-mark.svg"
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-md border border-[var(--cv-border)] object-contain shrink-0 bg-black"
              />
              <span className="text-heading font-semibold tracking-tight text-[var(--cv-text-primary)] truncate">
                Curavex
              </span>
            </a>

            <nav
              aria-label="Primary sections"
              className="hidden lg:flex items-center gap-1"
            >
              {NAV_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-9 items-center rounded-md px-3 text-label text-[var(--cv-text-secondary)] hover:bg-[var(--cv-surface-raised)] hover:text-[var(--cv-text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cv-accent)]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className="hidden xl:inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--cv-border)] bg-[var(--cv-canvas)] px-3 text-caption text-[var(--cv-text-secondary)]"
              title={activeModelId ?? undefined}
            >
              <Marker
                variant={apiStatus === "live" ? "pulse" : "dot"}
                tone={
                  apiStatus === "live"
                    ? "success"
                    : apiStatus === "connecting"
                      ? "info"
                      : "warning"
                }
                size="sm"
              />
              <span>
                {apiStatus === "live"
                  ? "Live API"
                  : apiStatus === "connecting"
                    ? "Connecting"
                    : "Reference"}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenCommand}
              aria-label="Search workspace and commands"
              className="relative inline-flex h-9 min-w-[36px] sm:w-44 items-center justify-center sm:justify-between gap-2 rounded-lg border border-[var(--cv-border)] bg-[var(--cv-canvas)] px-2.5 text-caption text-[var(--cv-text-secondary)] hover:border-[var(--cv-border-strong)] hover:text-[var(--cv-text-primary)] transition-colors cursor-pointer before:content-[''] before:absolute before:inset-[-4px]"
            >
              <span className="inline-flex items-center gap-2">
                <IconSearch size={15} stroke={1.8} className="shrink-0" />
                <span className="hidden sm:inline">Search…</span>
              </span>
              <Kbd size="sm" className="hidden md:inline-flex">
                ⌘K
              </Kbd>
            </button>

            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={
                theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
              }
              aria-pressed={theme === "dark"}
              title={theme === "dark" ? "Light theme" : "Dark theme"}
              className="relative inline-flex size-9 items-center justify-center rounded-lg border border-[var(--cv-border)] bg-[var(--cv-canvas)] text-[var(--cv-text-primary)] hover:border-[var(--cv-border-strong)] transition-colors cursor-pointer before:content-[''] before:absolute before:inset-[-4px]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-[16px]"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor" stroke="none" />
              </svg>
            </button>

            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--cv-accent)] px-3.5 text-label font-medium text-[var(--cv-on-accent)] transition-opacity hover:opacity-85"
            >
              <span>API docs</span>
              <IconArrowUpRight size={14} stroke={2} aria-hidden="true" />
            </a>

            <div className="lg:hidden">
              <HamburgerMenu
                variant="squeeze"
                open={mobileOpen}
                onOpenChange={setMobileOpen}
                aria-controls="mobile-workspace-sheet"
                aria-label="Open navigation menu"
              />
            </div>
          </div>
        </div>
      </header>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" id="mobile-workspace-sheet">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>
              Jump to clinical scoring, architecture, or API documentation.
            </SheetDescription>
          </SheetHeader>
          <nav
            aria-label="Mobile sections"
            className="flex flex-col gap-1 px-4 py-4"
          >
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => {
                  setMobileOpen(false);
                  if (item.href === "#workspace") onJumpToWorkspace();
                }}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-label text-[var(--cv-text-primary)] hover:bg-[var(--cv-surface-raised)] transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="my-2 border-t border-[var(--cv-border)]" />
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[44px] items-center justify-between rounded-lg px-3 text-label text-[var(--cv-text-primary)] hover:bg-[var(--cv-surface-raised)] transition-colors"
            >
              <span>API docs</span>
              <IconArrowUpRight size={16} aria-hidden="true" />
            </a>
            <a
              href="https://github.com/krishujeniya/curavex"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[44px] items-center justify-between rounded-lg px-3 text-label text-[var(--cv-text-primary)] hover:bg-[var(--cv-surface-raised)] transition-colors"
            >
              <span>GitHub</span>
              <IconArrowUpRight size={16} aria-hidden="true" />
            </a>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
