"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/react";
import { isClerkConfigured } from "@/components/auth/ClerkAuthWrapper";
import { useLocalAuth } from "@/components/auth/AuthProvider";
import { HamburgerMenu } from "@/components/wensity/animated-hamburger-menu";
import {
  persistTheme,
  readCurrentTheme,
  type ThemeMode,
} from "@/lib/theme";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/scoring", label: "Scoring" },
  { href: "/monitoring", label: "Monitoring" },
];

interface SiteHeaderProps {
  docsUrl?: string;
}

function ClerkHeaderAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || !isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          className="inline-flex h-[38px] items-center rounded-full border border-[var(--cv-border)] px-4 text-[13px] font-medium text-[var(--cv-text-primary)] transition-colors hover:border-[var(--cv-border-strong)] hover:bg-[var(--cv-surface-raised)] cursor-pointer"
        >
          Sign in
        </button>
      </SignInButton>
    );
  }
  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "size-7",
        },
      }}
    />
  );
}

export function SiteHeader({ docsUrl }: SiteHeaderProps) {
  const pathname = usePathname();
  const normalizedPath = (pathname || "/").replace(/\/$/, "") || "/";
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<ThemeMode>("light");
  const clerkReady = isClerkConfigured();
  const { user: localUser, openAuthModal, signOut } = useLocalAuth();

  React.useEffect(() => {
    setTheme(readCurrentTheme());
  }, []);

  React.useEffect(() => {
    if (!mobileOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    function onResize() {
      if (window.innerWidth >= 950) setMobileOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileOpen]);

  function handleToggleTheme() {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    persistTheme(next);
  }

  return (
    <>
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--cv-border)] bg-[var(--cv-surface)]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cv-accent)]"
            aria-label="Curavex home"
          >
            <img
              src="/assets/curavex-mark.svg"
              alt=""
              width={28}
              height={28}
              className="size-7 rounded-lg object-contain shrink-0"
            />
            <span className="text-[16px] font-medium tracking-[-0.01em] text-[var(--cv-text-primary)]">
              Curavex
            </span>
          </Link>

          <nav
            id="primary-nav"
            aria-label="Primary navigation"
            className="hidden min-[950px]:flex items-center gap-7 ml-auto"
          >
            {NAV_LINKS.map((item) => {
              const isActive = normalizedPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "inline-flex h-9 items-center text-[14px] font-medium tracking-[0.01em] transition-colors whitespace-nowrap",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cv-accent)]",
                    isActive
                      ? "text-[var(--cv-text-primary)]"
                      : "text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0 min-[950px]:ml-0 ml-auto min-[950px]:ml-0">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={
                theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
              }
              aria-pressed={theme === "dark"}
              title={theme === "dark" ? "Light theme" : "Dark theme"}
              className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--cv-border)] text-[var(--cv-text-secondary)] transition-colors hover:border-[var(--cv-border-strong)] hover:text-[var(--cv-text-primary)] cursor-pointer"
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

            {docsUrl ? (
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden min-[950px]:inline-flex h-[38px] items-center rounded-full border border-[var(--cv-border)] px-4 text-[13px] font-medium text-[var(--cv-text-primary)] transition-colors hover:border-[var(--cv-border-strong)] hover:bg-[var(--cv-surface-raised)]"
              >
                Docs
              </a>
            ) : null}

            {clerkReady ? (
              <span className="hidden min-[950px]:inline-flex">
                <ClerkHeaderAuth />
              </span>
            ) : localUser ? (
              <div className="flex items-center gap-2">
                <span className="hidden min-[950px]:inline-block text-[12px] font-medium text-[var(--cv-text-secondary)]">
                  {localUser.name}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="inline-flex h-[38px] items-center rounded-full border border-[var(--cv-border)] px-4 text-[13px] font-medium text-[var(--cv-text-primary)] hover:bg-[var(--cv-surface-raised)] transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openAuthModal("signin")}
                  className="hidden min-[950px]:inline-flex h-[38px] items-center rounded-full px-4 text-[13px] font-medium text-[var(--cv-text-primary)] hover:bg-[var(--cv-surface-raised)] transition-colors cursor-pointer"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal("signup")}
                  className="hidden min-[950px]:inline-flex h-[38px] items-center gap-1.5 rounded-full bg-[var(--cv-accent)] px-4 text-[13px] font-semibold text-[var(--cv-on-accent)] transition-opacity hover:opacity-90 cursor-pointer"
                >
                  Get started
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-3.5" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </>
            )}

            <div className="min-[950px]:hidden">
              <HamburgerMenu
                variant="squeeze"
                open={mobileOpen}
                onOpenChange={setMobileOpen}
                aria-controls="mobile-nav-menu"
                aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              />
            </div>
          </div>
        </div>

        {mobileOpen && (
          <nav
            id="mobile-nav-menu"
            aria-label="Mobile navigation"
            className="absolute left-0 right-0 top-full border-b border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 pb-4 pt-2 shadow-[0_18px_50px_rgba(0,0,0,0.14)] min-[950px]:hidden"
          >
            <div className="flex flex-col">
              {NAV_LINKS.map((item) => {
                const isActive = normalizedPath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "flex min-h-[44px] items-center border-b border-[var(--cv-border)] px-1 text-[15px] font-medium transition-colors last:border-b-0",
                      isActive
                        ? "text-[var(--cv-text-primary)]"
                        : "text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)]",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-[var(--cv-border)] pt-3">
              {docsUrl ? (
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-[var(--cv-border)] px-3 text-[14px] font-medium text-[var(--cv-text-primary)] transition-colors hover:bg-[var(--cv-surface-raised)]"
                >
                  Docs
                </a>
              ) : null}
              {clerkReady ? (
                <div className="flex min-h-[44px] flex-1 items-center justify-center">
                  <ClerkHeaderAuth />
                </div>
              ) : localUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    void signOut();
                  }}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-[var(--cv-border)] px-3 text-[14px] font-medium text-[var(--cv-text-primary)] transition-colors hover:bg-[var(--cv-surface-raised)] cursor-pointer"
                >
                  Sign out ({localUser.name})
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      openAuthModal("signin");
                    }}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-[var(--cv-border)] px-3 text-[14px] font-medium text-[var(--cv-text-primary)] transition-colors hover:bg-[var(--cv-surface-raised)] cursor-pointer"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      openAuthModal("signup");
                    }}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-[var(--cv-accent)] px-3 text-[14px] font-medium text-[var(--cv-on-accent)] transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
