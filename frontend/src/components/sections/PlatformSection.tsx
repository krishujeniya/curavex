"use client";

import * as React from "react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { Badge } from "@/components/wensity/badge";
import { Progress } from "@/components/wensity/progress";
import { Separator } from "@/components/wensity/separator";

const PILLARS = [
  {
    audience: "Clinical teams",
    title: "Calibrated scores you can defend",
    body: "Every prediction returns a point estimate with a 95% confidence interval and per-feature attribution — decision support, not a black box.",
  },
  {
    audience: "MLOps engineers",
    title: "Registry, drift, and audit built in",
    body: "Versioned .joblib registry with STAGING-to-PRODUCTION promotion, KS/PSI drift detection, and an append-only inference audit trail.",
  },
  {
    audience: "Platform & security",
    title: "Controlled access by default",
    body: "Tiered X-API-Key rate limits, monthly quotas, CORS and security headers at the edge, and per-key usage visibility.",
  },
];

const AUDIT_FEED = [
  { time: "12:41", event: "prediction served", detail: "support-agent cohort · score 7.2", tone: "ok" },
  { time: "12:37", event: "drift check", detail: "Dosage_mg PSI 0.11 · within baseline", tone: "ok" },
  { time: "12:31", event: "quota guard", detail: "free tier 4/5 requests this month", tone: "warn" },
  { time: "12:18", event: "model promoted", detail: "gradient_boosting-v2.0.0 → PRODUCTION", tone: "ok" },
];

export function PlatformSection() {
  return (
    <section className="border-t border-[var(--cv-border)] bg-[var(--cv-surface)] py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-20">
        {/* Pillars */}
        <div className="space-y-10">
          <div className="max-w-[65ch] space-y-4">
            <p className="text-caption font-medium uppercase tracking-[0.18em] text-[var(--cv-text-secondary)]">
              Platform
            </p>
            <h2 className="text-title text-[var(--cv-text-primary)]">
              One system of record for clinical inference
            </h2>
            <p className="text-body text-[var(--cv-text-secondary)]">
              Built for the teams who act on predictions — clinicians who need
              confidence bounds, engineers who need governance, and platform
              teams who need control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px border border-[var(--cv-border)] bg-[var(--cv-border)] rounded-2xl overflow-hidden">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="bg-[var(--cv-surface)] p-7 sm:p-8 flex flex-col gap-4"
              >
                <p className="text-caption font-medium uppercase tracking-[0.14em] text-[var(--cv-text-secondary)]">
                  {pillar.audience}
                </p>
                <h3 className="text-heading text-[var(--cv-text-primary)]">
                  {pillar.title}
                </h3>
                <p className="text-body text-[var(--cv-text-secondary)]">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Product panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Prediction output mock */}
          <div className="rounded-2xl border border-[var(--cv-border)] bg-[#0a0a0a] text-[#f4f4f5] p-7 sm:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-caption font-mono text-[#a8a8a8]">
                /api/v1/predict · live output
              </span>
              <span className="rounded-md border border-white/15 px-2 py-0.5 font-mono text-caption text-[#a8a8a8]">
                gradient_boosting-v2.0.0
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-caption text-[#a8a8a8]">
                Expected improvement score
              </div>
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-display text-white">7.20</span>
                <span className="text-body text-[#a8a8a8]">/ 10.0</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-caption text-[#a8a8a8]">
                <span>95% confidence interval</span>
                <code className="font-mono text-white slashed-zero">
                  [4.34 – 10.00]
                </code>
              </div>
              <Progress
                value={7.2}
                max={10}
                size="md"
                tone="brand"
                label="Improvement score"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="text-caption font-medium uppercase tracking-[0.14em] text-[#a8a8a8]">
                Local feature attribution
              </div>
              {[
                { feature: "Treatment_Duration_days", pct: 82 },
                { feature: "Age", pct: 64 },
                { feature: "Drug_Name", pct: 41 },
              ].map((item) => (
                <div key={item.feature} className="space-y-1.5">
                  <div className="flex items-center justify-between text-caption">
                    <span className="font-mono text-[#d4d4d4]">{item.feature}</span>
                    <span className="font-mono tabular-nums text-[#a8a8a8]">
                      {item.pct}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/80"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto flex items-center justify-between gap-4 text-caption font-mono text-[#a8a8a8] tabular-nums">
              <span>Inference: 0.2 ms</span>
              <span className="truncate max-w-[220px]">
                gradient_boosting-v2.0.0-c31272
              </span>
            </div>
          </div>

          {/* Audit feed mock */}
          <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-canvas)] p-7 sm:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-caption font-medium uppercase tracking-[0.14em] text-[var(--cv-text-secondary)]">
                Runtime audit · live feed
              </span>
              <Badge variant="success" dot size="sm">
                nominal
              </Badge>
            </div>

            <ul className="divide-y divide-[var(--cv-border)] flex-1">
              {AUDIT_FEED.map((row) => (
                <li
                  key={row.time + row.event}
                  className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <span className="font-mono text-caption tabular-nums text-[var(--cv-text-secondary)] shrink-0 pt-0.5">
                    {row.time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-label font-medium text-[var(--cv-text-primary)]">
                      {row.event}
                    </div>
                    <div className="text-caption text-[var(--cv-text-secondary)] truncate">
                      {row.detail}
                    </div>
                  </div>
                  <Badge
                    variant={row.tone === "warn" ? "warning" : "success"}
                    size="sm"
                    className="shrink-0"
                  >
                    {row.tone === "warn" ? "flagged" : "ok"}
                  </Badge>
                </li>
              ))}
            </ul>

            <a
              href="/monitoring"
              className="inline-flex items-center gap-1.5 text-label font-medium text-[var(--cv-text-primary)] hover:underline underline-offset-4"
            >
              Open live monitoring
              <IconArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
