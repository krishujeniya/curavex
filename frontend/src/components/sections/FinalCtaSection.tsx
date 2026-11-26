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
    <section
      className="relative overflow-hidden border-t border-white/10 py-16 sm:py-24 text-white"
      style={{
        background:
          "linear-gradient(135deg, #000000 0%, #1a1a1a 52%, #050505 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-56 -top-56 size-[560px] rounded-full border border-white/15"
        style={{
          boxShadow:
            "0 0 0 110px rgba(255,255,255,0.04), 0 0 0 220px rgba(255,255,255,0.02)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="space-y-4 max-w-[60ch]">
            <h2 className="font-[family-name:var(--font-display)] text-display text-white">
              Integrate clinical scoring into your stack.
            </h2>
            <p className="text-body text-[#b5b5b5]">
              Provision an X-API-Key in seconds, inspect the OpenAPI schema, or run
              batch cohort evaluations from your own pipeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenApiTab}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-3 text-label font-semibold text-black transition-transform hover:-translate-y-0.5 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #e2e2e2 100%)",
              }}
            >
              <span>Provision API key</span>
              <IconArrowUpRight size={16} stroke={2} />
            </button>
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-label text-white hover:border-white/60 transition-colors"
            >
              <span>OpenAPI docs</span>
              <IconArrowUpRight size={16} stroke={2} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
