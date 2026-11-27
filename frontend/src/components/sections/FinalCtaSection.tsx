"use client";

import * as React from "react";
import { IconArrowUpRight } from "@tabler/icons-react";

export function FinalCtaSection({
  docsUrl,
  onOpenApiTab,
}: {
  docsUrl: string;
  onOpenApiTab: () => void;
}) {
  return (
    <section className="border-t border-[var(--cv-border)] bg-[#0a0a0a] py-14 sm:py-20 text-[#f4f4f5]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="space-y-3 max-w-[60ch]">
            <h2 className="text-title text-white">
              Connect Curavex to your clinical pipeline.
            </h2>
            <p className="text-body text-[#a8a8a8]">
              Provision an X-API-Key, inspect the OpenAPI schema, or run batch
              cohort evaluations from your own backend.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenApiTab}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-6 py-2.5 text-label font-semibold text-black transition-opacity hover:opacity-90 cursor-pointer"
            >
              <span>Provision API key</span>
              <IconArrowUpRight size={16} stroke={2} aria-hidden="true" />
            </button>
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-label text-white hover:border-white/50 transition-colors"
            >
              <span>OpenAPI docs</span>
              <IconArrowUpRight size={16} stroke={2} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
