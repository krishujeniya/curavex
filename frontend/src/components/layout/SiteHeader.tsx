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
import { UnderlineAnimation } from "@/components/wensity/underline-animation";
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
  const [scrollRatio, setScrollRatio] = React.useState(0);

  React.useEffect(() => {
    setTheme(readCurrentTheme());
  }, []);

  React.useEffect(() => {
    const updateProgress = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio =
        scrollable > 0 ? Math.max(0, Math.min(1, window.scrollY / scrollable)) : 0;
      setScrollRatio(ratio);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  function handleToggleTheme() {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    persistTheme(next);
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left pointer-events-none"
        style={{
          background: "var(--cv-grad-progress)",
          transform: `scaleX(${scrollRatio})`,
        }}
      />

      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--cv-border)] bg-[color-mix(in_srgb,var(--cv-canvas)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 min-w-0">
            <a
              href="#top"
              className="flex items-center gap-2.5 min-w-0 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cv-accent)] rounded-md"
              aria-label="Curavex home"
            >
              <img
                src="./assets/curavex-mark.svg"
                alt=""
                width={30}
                height={30}
                className="size-8 rounded-lg border border-[var(--cv-border)] object-contain shrink-0 bg-black"
              />
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--cv-text-primary)] truncate">
                Curavex
              </span>
            </a>

            <nav
              aria-label="Primary sections"
              className="hidden lg:flex items-center gap-6"
            >
              {NAV_LINKS.map((item) => (
                <UnderlineAnimation
                  key={item.href}
                  href={item.href}
                  variant="slide"
                  thickness={1.5}
                  offset={4}
                  className="text-label text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)] transition-colors"
                >
                  {item.label}
                </UnderlineAnimation>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="hidden xl:flex items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-1.5 text-caption text-[var(--cv-text-secondary)]">
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
              <span className="font-mono truncate max-w-[180px]">
                {apiStatus === "live" && activeModelId
                  ? activeModelId
                  : apiStatus === "connecting"
                    ? "Connecting"
                    : "Reference mode"}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenCommand}
              aria-label="Search workspace and commands"
              className="inline-flex h-10 min-w-[44px] items-center justify-center sm:justify-between gap-2.5 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 text-caption text-[var(--cv-text-secondary)] hover:border-[var(--cv-accent)] hover:text-[var(--cv-text-primary)] transition-colors cursor-pointer"
            >
              <IconSearch size={15} stroke={1.8} className="shrink-0" />
              <span className="hidden sm:inline">Quick jump</span>
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
              className="inline-flex size-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-primary)] hover:border-[var(--cv-accent)] transition-colors cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-[17px]"
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
              className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-full border border-[#2e2e2e] px-4 text-caption font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--cv-grad-dark)" }}
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
            <SheetTitle>Curavex navigation</SheetTitle>
            <SheetDescription>
              Jump to clinical scoring, architecture, or API references.
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
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex min-h-[44px] items-center justify-between rounded-lg border border-[var(--cv-border)] px-3 text-label text-[var(--cv-text-primary)] hover:border-[var(--cv-border-strong)] transition-colors"
            >
              <span>OpenAPI docs</span>
              <IconArrowUpRight size={16} />
            </a>
            <a
              href="https://github.com/krishujeniya/curavex"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[44px] items-center justify-between rounded-lg border border-[var(--cv-border)] px-3 text-label text-[var(--cv-text-primary)] hover:border-[var(--cv-border-strong)] transition-colors"
            >
              <span>GitHub repository</span>
              <IconArrowUpRight size={16} />
            </a>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
