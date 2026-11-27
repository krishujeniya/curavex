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

const NAV_LINKS = [
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
          "sticky top-0 z-[var(--z-sticky)] border-b transition-[background-color,border-color] duration-200",
          scrolled
            ? "border-[var(--cv-border)] bg-[color-mix(in_srgb,var(--cv-surface)_85%,transparent)] backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            : "border-transparent bg-[var(--cv-surface)]",
        ].join(" ")}
      >
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-8 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cv-accent)]"
            aria-label="Curavex home"
          >
            <img
              src="/assets/curavex-mark.svg"
              alt=""
              width={26}
              height={26}
              className="size-[26px] rounded-md object-contain shrink-0"
            />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--cv-text-primary)]">
              Curavex
            </span>
          </Link>

          {/* Desktop navigation — flat inline links */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-1"
          >
            {NAV_LINKS.map((item) => {
              const isActive = normalizedPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "relative inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cv-accent)]",
                    isActive
                      ? "text-[var(--cv-text-primary)] bg-[var(--cv-surface-raised)]"
                      : "text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)] hover:bg-[var(--cv-surface-raised)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right-side actions */}
          <div className="flex items-center gap-2 shrink-0">
            {clerkReady && (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="hidden sm:inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)] transition-colors cursor-pointer"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                  <Link
                    href="/scoring"
                    className="inline-flex h-8 items-center rounded-lg bg-[var(--cv-accent)] px-3.5 text-[13px] font-medium text-[var(--cv-on-accent)] transition-opacity hover:opacity-90 cursor-pointer shadow-sm"
                  >
                    Get started
                  </Link>
                </SignedOut>
                <SignedIn>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "size-7",
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
              className="relative inline-flex size-8 items-center justify-center rounded-md text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)] hover:bg-[var(--cv-surface-raised)] transition-colors cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-4"
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
              Navigate between scoring, models, monitoring, API keys, and pricing.
            </SheetDescription>
          </SheetHeader>
          <nav
            aria-label="Mobile navigation"
            className="flex flex-col gap-0.5 px-4 py-4"
          >
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              aria-current={normalizedPath === "/" ? "page" : undefined}
              className={[
                "flex min-h-[44px] w-full items-center rounded-lg px-3 text-[14px] font-medium transition-colors",
                normalizedPath === "/"
                  ? "bg-[var(--cv-surface-raised)] text-[var(--cv-text-primary)]"
                  : "text-[var(--cv-text-secondary)] hover:bg-[var(--cv-surface-raised)] hover:text-[var(--cv-text-primary)]",
              ].join(" ")}
            >
              Overview
            </Link>
            {NAV_LINKS.map((item) => {
              const isActive = normalizedPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "flex min-h-[44px] w-full items-center rounded-lg px-3 text-[14px] font-medium transition-colors",
                    isActive
                      ? "bg-[var(--cv-surface-raised)] text-[var(--cv-text-primary)]"
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
