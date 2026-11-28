"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/react";
import {
  IconBook,
  IconChevronDown,
} from "@tabler/icons-react";
import { isClerkConfigured } from "@/components/auth/ClerkAuthWrapper";
import { useLocalAuth } from "@/components/auth/AuthProvider";
import { HamburgerMenu } from "@/components/wensity/animated-hamburger-menu";
import {
  persistTheme,
  readCurrentTheme,
  type ThemeMode,
} from "@/lib/theme";

const PRODUCTS = [
  { href: "/scoring", label: "Score a patient" },
  { href: "/monitoring", label: "Monitoring" },
  { href: "/monitoring?tab=keys", label: "API keys" },
];

const NAV_LINKS = [
  { href: "/#pricing", label: "Pricing" },
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
  const [productsOpen, setProductsOpen] = React.useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<ThemeMode>("light");
  const [scrolled, setScrolled] = React.useState(false);
  const [navHidden, setNavHidden] = React.useState(false);
  const clerkReady = isClerkConfigured();
  const { user: localUser, openAuthModal, signOut } = useLocalAuth();
  const productsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setTheme(readCurrentTheme());
  }, []);

  React.useEffect(() => {
    let lastY = Math.max(0, window.scrollY || 0);
    let hidden = false;
    let raf = 0;

    const update = () => {
      raf = 0;
      const y = Math.max(0, window.scrollY || 0);
      setScrolled(y > 0);
      if (y <= 0 || mobileOpen) {
        if (hidden) {
          hidden = false;
          setNavHidden(false);
        }
        lastY = y;
        return;
      }
      const delta = y - lastY;
      if (delta > 5 && !hidden) {
        hidden = true;
        setNavHidden(true);
      } else if (delta < -5 && hidden) {
        hidden = false;
        setNavHidden(false);
      }
      if (Math.abs(delta) > 5) lastY = y;
    };

    const queue = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", queue, { passive: true });
    return () => {
      window.removeEventListener("scroll", queue);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mobileOpen]);

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

  React.useEffect(() => {
    if (!productsOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProductsOpen(false);
    }

    function onPointerDown(event: MouseEvent) {
      if (
        productsRef.current &&
        !productsRef.current.contains(event.target as Node)
      ) {
        setProductsOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [productsOpen]);

  function handleToggleTheme() {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    persistTheme(next);
  }

  const navLinkClass = (isActive: boolean) =>
    [
      "inline-flex h-9 items-center text-[14px] font-medium tracking-[0.01em] transition-colors whitespace-nowrap",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cv-accent)]",
      isActive
        ? "text-[var(--cv-text-primary)]"
        : "text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)]",
    ].join(" ");

  return (
    <>
      <header
        className={`sticky top-0 z-[var(--z-sticky)] border-b bg-[var(--cv-surface)]/85 backdrop-blur-md transition-[transform,border-color,background-color] duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)] will-change-transform ${
          navHidden ? "-translate-y-full" : "translate-y-0"
        } ${
          scrolled
            ? "border-[var(--cv-border)] bg-[var(--cv-surface)]/95"
            : "border-transparent bg-[var(--cv-surface)]/70"
        }`}
      >
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
            {/* Products dropdown */}
            <div
              ref={productsRef}
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button
                type="button"
                onClick={() => setProductsOpen((o) => !o)}
                aria-expanded={productsOpen}
                aria-haspopup="true"
                className={[
                  navLinkClass(false),
                  "gap-1 cursor-pointer",
                  productsOpen ? "text-[var(--cv-text-primary)]" : "",
                ].join(" ")}
              >
                Products
                <IconChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {productsOpen && (
                <div className="absolute left-1/2 top-full z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 pt-3">
                  <div className="overflow-hidden rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.14)]">
                    <div className="grid grid-cols-2 gap-0.5 p-1.5">
                    {PRODUCTS.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setProductsOpen(false)}
                        className="rounded-lg px-3.5 py-2.5 text-[13px] font-medium text-[var(--cv-text-secondary)] transition-colors hover:bg-[var(--cv-surface-raised)] hover:text-[var(--cv-text-primary)]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  </div>
                </div>
              )}
            </div>

            {NAV_LINKS.map((item) => {
              const isActive = normalizedPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={navLinkClass(isActive)}
                >
                  {item.label}
                </Link>
              );
            })}

            {docsUrl ? (
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={navLinkClass(false)}
              >
                Documentation
              </a>
            ) : null}
          </nav>

          <div className="flex items-center gap-2.5 shrink-0 ml-auto min-[950px]:ml-0">
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
              <button
                type="button"
                onClick={() => setMobileProductsOpen((o) => !o)}
                aria-expanded={mobileProductsOpen}
                className="flex min-h-[44px] items-center justify-between border-b border-[var(--cv-border)] px-1 text-[15px] font-medium text-[var(--cv-text-primary)]"
              >
                Products
                <IconChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${mobileProductsOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              {mobileProductsOpen && (
                <div className="flex flex-col pb-1">
                  {PRODUCTS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => {
                        setMobileOpen(false);
                        setMobileProductsOpen(false);
                      }}
                      className="flex min-h-[44px] items-center border-b border-[var(--cv-border)] px-4 text-[14px] font-medium text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center border-b border-[var(--cv-border)] px-1 text-[15px] font-medium text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)]"
                >
                  {item.label}
                </Link>
              ))}

              {docsUrl ? (
                <a
                  href={docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center gap-2 border-b border-[var(--cv-border)] px-1 text-[15px] font-medium text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)]"
                >
                  <IconBook size={16} stroke={1.8} aria-hidden="true" />
                  Documentation
                </a>
              ) : null}
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-[var(--cv-border)] pt-3">
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
