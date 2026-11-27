"use client";

import * as React from "react";
import { HamburgerMenu } from "@/components/wensity/animated-hamburger-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/wensity/sheet";
import type { WorkspaceTabId } from "@/components/layout/WorkspaceCommand";
import {
  persistTheme,
  readCurrentTheme,
  type ThemeMode,
} from "@/lib/theme";

export interface SiteHeaderProps {
  activeTab: WorkspaceTabId;
  onSelectTab: (tab: WorkspaceTabId) => void;
}

const NAV_TABS: Array<{ id: WorkspaceTabId; label: string }> = [
  { id: "predict", label: "Clinical scoring" },
  { id: "mlops", label: "Model registry" },
  { id: "monitoring", label: "Monitoring" },
  { id: "apikeys", label: "API keys" },
];

export function SiteHeader({ activeTab, onSelectTab }: SiteHeaderProps) {
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
          <div className="flex items-center gap-6 min-w-0">
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
              aria-label="Workspace tabs"
              className="hidden md:flex items-center gap-1"
            >
              {NAV_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "inline-flex h-9 items-center rounded-lg px-3 text-label transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cv-accent)]",
                      isActive
                        ? "bg-[var(--cv-accent)] font-medium text-[var(--cv-on-accent)]"
                        : "text-[var(--cv-text-secondary)] hover:bg-[var(--cv-surface-raised)] hover:text-[var(--cv-text-primary)]",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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

            <div className="md:hidden">
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
            <SheetTitle>Workspace tabs</SheetTitle>
            <SheetDescription>
              Switch between scoring, model registry, monitoring, and API keys.
            </SheetDescription>
          </SheetHeader>
          <nav
            aria-label="Mobile workspace tabs"
            className="flex flex-col gap-1 px-4 py-4"
          >
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onSelectTab(tab.id);
                  }}
                  className={[
                    "flex min-h-[44px] w-full items-center rounded-lg px-3 text-start text-label transition-colors cursor-pointer",
                    isActive
                      ? "bg-[var(--cv-accent)] font-medium text-[var(--cv-on-accent)]"
                      : "text-[var(--cv-text-primary)] hover:bg-[var(--cv-surface-raised)]",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
