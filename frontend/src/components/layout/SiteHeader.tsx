"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";
import {
  IconBook,
  IconBrandGithub,
  IconChartBar,
  IconCpu,
  IconKey,
  IconPalette,
  IconSearch,
  IconTable,
} from "@tabler/icons-react";
import { isClerkConfigured } from "@/components/auth/ClerkAuthWrapper";
import { useLocalAuth } from "@/components/auth/AuthProvider";
import { HamburgerMenu } from "@/components/wensity/animated-hamburger-menu";
import { CommandDialog, type CommandGroup } from "@/components/wensity/command";
import { CLINICAL_PRESETS } from "@/lib/clinical-validation";
import {
  persistTheme,
  readCurrentTheme,
  type ThemeMode,
} from "@/lib/theme";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/scoring", label: "Scoring" },
  { href: "/models", label: "Models" },
  { href: "/monitoring", label: "Monitoring" },
  { href: "/api-keys", label: "API keys" },
  { href: "/pricing", label: "Pricing" },
];

const GITHUB_URL = "https://github.com/krishujeniya/curavex";
const DEFAULT_DOCS_URL = "https://curavex-api.curavex.workers.dev/docs";

interface SiteHeaderProps {
  docsUrl?: string;
}

export function SiteHeader({ docsUrl = DEFAULT_DOCS_URL }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const normalizedPath = (pathname || "/").replace(/\/$/, "") || "/";
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<ThemeMode>("light");
  const [scrolled, setScrolled] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const lastScrollY = React.useRef(0);
  const scrollRaf = React.useRef(0);
  const clerkReady = isClerkConfigured();
  const { user: localUser, openAuthModal, signOut } = useLocalAuth();

  React.useEffect(() => {
    setTheme(readCurrentTheme());
  }, []);

  React.useEffect(() => {
    lastScrollY.current = Math.max(0, window.scrollY || 0);
    setScrolled(lastScrollY.current > 0);

    const updateNavbar = () => {
      scrollRaf.current = 0;
      const y = Math.max(0, window.scrollY || 0);
      const nextScrolled = y > 0;
      if (nextScrolled !== scrolled) setScrolled(nextScrolled);

      if (y <= 0 || mobileOpen) {
        if (hidden) setHidden(false);
        lastScrollY.current = y;
        return;
      }

      const delta = y - lastScrollY.current;
      if (delta > 5 && !hidden) setHidden(true);
      else if (delta < -5 && hidden) setHidden(false);
      if (Math.abs(delta) > 5) lastScrollY.current = y;
    };

    const queueNavbar = () => {
      if (!scrollRaf.current) {
        scrollRaf.current = window.requestAnimationFrame(updateNavbar);
      }
    };

    updateNavbar();
    window.addEventListener("scroll", queueNavbar, { passive: true });
    window.addEventListener("resize", queueNavbar, { passive: true });
    return () => {
      window.removeEventListener("scroll", queueNavbar);
      window.removeEventListener("resize", queueNavbar);
      if (scrollRaf.current) window.cancelAnimationFrame(scrollRaf.current);
    };
  }, [hidden, mobileOpen, scrolled]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
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

  function goTo(href: string) {
    setMobileOpen(false);
    setCommandOpen(false);
    router.push(href);
  }

  const commandGroups: CommandGroup[] = React.useMemo(
    () => [
      {
        heading: "Pages",
        items: NAV_LINKS.map((item) => ({
          id: `page-${item.href}`,
          label: item.label,
          description: item.href,
          onSelect: () => goTo(item.href),
        })),
      },
      {
        heading: "Clinical presets",
        items: CLINICAL_PRESETS.map((preset) => ({
          id: `preset-${preset.id}`,
          label: preset.label,
          description: preset.summary,
          keywords: [preset.input.Condition, preset.input.Drug_Name, "preset"],
          icon: <IconTable size={16} />,
          onSelect: () =>
            goTo(`/scoring?preset=${encodeURIComponent(preset.id)}`),
        })),
      },
      {
        heading: "Workspace",
        items: [
          {
            id: "workspace-predict",
            label: "Single patient scoring",
            description: "Score one patient regimen",
            icon: <IconChartBar size={16} />,
            onSelect: () => goTo("/scoring"),
          },
          {
            id: "workspace-batch",
            label: "Batch cohort scoring",
            description: "Upload and score CSV cohorts",
            icon: <IconTable size={16} />,
            onSelect: () => goTo("/scoring"),
          },
          {
            id: "workspace-models",
            label: "Model registry",
            description: "Compare, benchmark, and promote models",
            icon: <IconCpu size={16} />,
            onSelect: () => goTo("/models"),
          },
          {
            id: "workspace-monitoring",
            label: "Monitoring",
            description: "Inspect drift, latency, and audit logs",
            icon: <IconChartBar size={16} />,
            onSelect: () => goTo("/monitoring"),
          },
          {
            id: "workspace-apikeys",
            label: "API keys",
            description: "Provision X-API-Key credentials",
            icon: <IconKey size={16} />,
            onSelect: () => goTo("/api-keys"),
          },
        ],
      },
      {
        heading: "Actions",
        items: [
          {
            id: "toggle-theme",
            label: "Toggle light / dark theme",
            description: "Switch the monochrome interface polarity",
            icon: <IconPalette size={16} />,
            onSelect: () => {
              handleToggleTheme();
              setCommandOpen(false);
            },
          },
          {
            id: "open-docs",
            label: "Open API docs",
            description: docsUrl,
            icon: <IconBook size={16} />,
            onSelect: () => {
              window.open(docsUrl, "_blank", "noopener,noreferrer");
              setCommandOpen(false);
            },
          },
          {
            id: "open-github",
            label: "Open GitHub repository",
            description: GITHUB_URL,
            icon: <IconBrandGithub size={16} />,
            onSelect: () => {
              window.open(GITHUB_URL, "_blank", "noopener,noreferrer");
              setCommandOpen(false);
            },
          },
        ],
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docsUrl, theme],
  );

  return (
    <>
      <header
        className={[
          "sticky top-0 z-[var(--z-sticky)] border-b transition-[background-color,border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(.165,.84,.44,1)]",
          scrolled
            ? "border-[var(--cv-border)] bg-[color-mix(in_srgb,var(--cv-surface)_94%,transparent)] backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            : "border-transparent bg-[color-mix(in_srgb,var(--cv-surface)_88%,transparent)]",
          hidden ? "-translate-y-full" : "translate-y-0",
        ].join(" ")}
      >
        <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8 min-[950px]:gap-5">
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cv-accent)]"
            aria-label="Curavex home"
          >
            <img
              src="/assets/curavex-mark.svg"
              alt=""
              width={26}
              height={26}
              className="size-[26px] rounded-md object-contain shrink-0"
            />
            <span className="text-[15px] font-semibold tracking-[-0.015em] text-[var(--cv-text-primary)]">
              Curavex
            </span>
          </Link>

          <nav
            id="primary-nav"
            aria-label="Primary navigation"
            className="hidden min-[950px]:flex items-center gap-4 xl:gap-5 ml-auto"
          >
            {NAV_LINKS.map((item) => {
              const isActive = normalizedPath === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "inline-flex h-8 items-center text-[14px] font-semibold tracking-[0.01em] transition-colors whitespace-nowrap",
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

          <div className="flex items-center gap-2 shrink-0 min-[950px]:ml-0">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={
                theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
              }
              aria-pressed={theme === "dark"}
              title={theme === "dark" ? "Light theme" : "Dark theme"}
              className="inline-flex size-[34px] items-center justify-center rounded-full border border-[var(--cv-border)] text-[var(--cv-text-secondary)] transition-colors hover:border-[var(--cv-border-strong)] hover:text-[var(--cv-text-primary)] cursor-pointer"
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
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="inline-flex h-[34px] items-center rounded-full bg-[var(--cv-accent)] px-3.5 text-[12px] font-semibold text-[var(--cv-on-accent)] transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      Login
                    </button>
                  </SignInButton>
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
            ) : localUser ? (
              <div className="flex items-center gap-2">
                <span className="hidden min-[950px]:inline-block text-[12px] font-medium text-[var(--cv-text-secondary)]">
                  {localUser.name}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="inline-flex h-[34px] items-center rounded-full border border-[var(--cv-border)] px-3 text-[12px] font-medium text-[var(--cv-text-primary)] hover:bg-[var(--cv-surface-raised)] transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("signin")}
                className="inline-flex h-[34px] items-center rounded-full bg-[var(--cv-accent)] px-3.5 text-[12px] font-semibold text-[var(--cv-on-accent)] transition-opacity hover:opacity-90 cursor-pointer"
              >
                Login
              </button>
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
                        "flex min-h-[44px] items-center border-b border-[var(--cv-border)] px-1 text-[15px] font-semibold transition-colors last:border-b-0",
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

              {clerkReady ? (
                <div className="mt-3 flex items-center gap-2 border-t border-[var(--cv-border)] pt-3">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        className="flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-[var(--cv-border)] px-3 text-[14px] font-medium text-[var(--cv-text-primary)] transition-colors hover:bg-[var(--cv-surface-raised)] cursor-pointer"
                      >
                        Sign in
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        type="button"
                        className="flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-[var(--cv-accent)] px-3 text-[14px] font-medium text-[var(--cv-on-accent)] transition-opacity hover:opacity-90 cursor-pointer"
                      >
                        Sign up
                      </button>
                    </SignUpButton>
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
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 border-t border-[var(--cv-border)] pt-3">
                  {localUser ? (
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
              )}
            </nav>
          )}
        </div>
      </header>

      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        groups={commandGroups}
        placeholder="Search pages, presets, docs, or actions…"
        emptyMessage="No matching Curavex command."
        aria-label="Curavex command palette"
      />
    </>
  );
}
