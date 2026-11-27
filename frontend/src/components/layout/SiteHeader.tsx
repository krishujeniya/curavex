"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { isClerkConfigured } from "@/components/auth/ClerkAuthWrapper";
import { HamburgerMenu } from "@/components/wensity/animated-hamburger-menu";
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

const NAV_PAGES = [
  { href: "/", label: "Overview" },
  { href: "/scoring", label: "Scoring" },
  { href: "/models", label: "Models" },
  { href: "/monitoring", label: "Monitoring" },
  { href: "/api-keys", label: "API keys" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const normalizedPath = (pathname || "/").replace(/\/$/, "") || "/";
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<ThemeMode>("light");
  const [scrolled, setScrolled] = React.useState(false);
  const clerkReady = isClerkConfigured();

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
          "sticky top-0 z-[var(--z-sticky)] border-b border-[var(--cv-border)] transition-colors duration-150",
          scrolled
            ? "bg-[color-mix(in_srgb,var(--cv-surface)_88%,transparent)] backdrop-blur-md"
            : "bg-[var(--cv-surface)]",
        ].join(" ")}
      >
        <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-[1fr_auto] lg:grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center min-w-0 justify-self-start">
            <Link
              href="/"
              className="flex items-center gap-2.5 min-w-0 shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cv-accent)]"
              aria-label="Curavex home"
            >
              <img
                src="/assets/curavex-mark.svg"
                alt=""
                width={28}
                height={28}
                className="size-7 rounded-md border border-[var(--cv-border)] object-contain shrink-0 bg-black"
              />
              <span className="text-heading font-semibold tracking-tight text-[var(--cv-text-primary)] truncate">
                Curavex
              </span>
            </Link>
          </div>

          <nav
            aria-label="Primary navigation"
            className="hidden lg:inline-flex items-center gap-1 rounded-xl border border-[var(--cv-border)] bg-[var(--cv-canvas)] p-1 justify-self-center"
          >
            {NAV_PAGES.map((item) => {
              const isActive = normalizedPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "inline-flex h-8 items-center rounded-lg px-3.5 text-label transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cv-accent)]",
                    isActive
                      ? "bg-[var(--cv-surface)] font-medium text-[var(--cv-text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-[var(--cv-border)]"
                      : "text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0 justify-self-end">
            {clerkReady && (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="inline-flex h-9 items-center rounded-lg bg-[var(--cv-accent)] px-3.5 text-label font-medium text-[var(--cv-on-accent)] transition-opacity hover:opacity-85 cursor-pointer"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "size-8",
                      },
                    }}
                  />
                </SignedIn>
              </>
            )}

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
            <SheetTitle>Curavex</SheetTitle>
            <SheetDescription>
              Navigate between overview, scoring, models, monitoring, API keys, and pricing.
            </SheetDescription>
          </SheetHeader>
          <nav
            aria-label="Mobile navigation"
            className="flex flex-col gap-1 px-4 py-4"
          >
            {NAV_PAGES.map((item) => {
              const isActive = normalizedPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "flex min-h-[44px] w-full items-center rounded-lg px-3 text-label transition-colors",
                    isActive
                      ? "bg-[var(--cv-surface-raised)] font-medium text-[var(--cv-text-primary)] ring-1 ring-[var(--cv-border)]"
                      : "text-[var(--cv-text-secondary)] hover:bg-[var(--cv-surface-raised)] hover:text-[var(--cv-text-primary)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
