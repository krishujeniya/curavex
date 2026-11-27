"use client";

import * as React from "react";
import { IconArrowUp } from "@tabler/icons-react";

export function SiteFooter({ docsUrl }: { docsUrl: string }) {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="border-t border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-secondary)]">
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <div className="text-label font-semibold text-[var(--cv-text-primary)]">
              Curavex
            </div>
            <p className="text-caption text-[var(--cv-text-secondary)]">
              Clinical treatment-response regression and MLOps governance.
            </p>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-label"
            aria-label="Footer"
          >
            <a
              href="#workspace"
              className="min-h-[44px] inline-flex items-center hover:text-[var(--cv-text-primary)] transition-colors"
            >
              Workspace
            </a>
            <a
              href="#architecture"
              className="min-h-[44px] inline-flex items-center hover:text-[var(--cv-text-primary)] transition-colors"
            >
              Architecture
            </a>
            <a
              href="#methodology"
              className="min-h-[44px] inline-flex items-center hover:text-[var(--cv-text-primary)] transition-colors"
            >
              Methodology
            </a>
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center hover:text-[var(--cv-text-primary)] transition-colors"
            >
              API docs
            </a>
            <a
              href="https://github.com/krishujeniya/curavex"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center hover:text-[var(--cv-text-primary)] transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--cv-border)] pt-6 text-caption">
          <div className="flex flex-wrap items-center gap-3">
            <span>© 2026 Curavex</span>
            <span aria-hidden="true" className="text-[var(--cv-border-strong)]">
              /
            </span>
            <a
              href="https://github.com/krishujeniya"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--cv-text-primary)] transition-colors"
            >
              Built by Krish Ujeniya
            </a>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex min-h-[44px] items-center gap-2 text-caption font-medium text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)] transition-colors cursor-pointer"
            aria-label="Back to top"
          >
            <span>Back to top</span>
            <IconArrowUp size={14} stroke={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
