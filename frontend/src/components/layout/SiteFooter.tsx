"use client";

import * as React from "react";
import { IconArrowUp } from "@tabler/icons-react";

export function SiteFooter({ docsUrl }: { docsUrl: string }) {
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="border-t border-[var(--cv-border)] bg-[#050505] text-[#f4f4f5]">
      <div className="mx-auto max-w-[1440px] px-4 pt-12 pb-8 sm:px-6 sm:pt-16 lg:px-8 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/10 pb-8">
          <p className="text-caption text-[#a8a8a8]">
            © 2026 Curavex — Clinical treatment-response regression and MLOps
          </p>

          <nav
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-label text-[#a8a8a8]"
            aria-label="Footer"
          >
            <a
              href="#workspace"
              className="min-h-[44px] inline-flex items-center hover:text-white transition-colors"
            >
              Workspace
            </a>
            <a
              href="#architecture"
              className="min-h-[44px] inline-flex items-center hover:text-white transition-colors"
            >
              Architecture
            </a>
            <a
              href="#methodology"
              className="min-h-[44px] inline-flex items-center hover:text-white transition-colors"
            >
              Methodology
            </a>
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center hover:text-white transition-colors"
            >
              API docs
            </a>
            <a
              href="https://github.com/krishujeniya/curavex"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center hover:text-white transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>

        <div
          aria-hidden="true"
          className="select-none overflow-hidden py-4 sm:py-6 flex justify-center"
        >
          <div className="text-[clamp(3.25rem,15vw,13rem)] font-semibold leading-[0.9] tracking-[-0.045em] text-white whitespace-nowrap">
            Curavex
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-caption text-[#a8a8a8]">
          <div className="flex flex-wrap items-center gap-3">
            <span>Curavex</span>
            <span aria-hidden="true" className="text-white/25">
              /
            </span>
            <a
              href="https://github.com/krishujeniya"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Built by Krish Ujeniya
            </a>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex min-h-[44px] items-center gap-2 text-caption font-medium text-[#a8a8a8] hover:text-white transition-colors cursor-pointer"
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
