"use client";

import * as React from "react";
import {
  IconArrowUpRight,
  IconHeartbeat,
  IconLock,
  IconShieldCheck,
} from "@tabler/icons-react";
import { Badge } from "@/components/wensity/badge";

const AUDIENCES = [
  {
    title: "Clinical teams",
    body: "Calibrated scores with confidence intervals and per-feature attribution — decision support you can defend at the point of care.",
    icon: IconHeartbeat,
  },
  {
    title: "MLOps engineers",
    body: "A versioned model registry, KS/PSI drift detection, and an append-only inference audit trail — governance without a second system.",
    icon: IconShieldCheck,
  },
  {
    title: "Platform & security",
    body: "Tiered X-API-Key rate limits, monthly quotas, edge-enforced CORS and security headers, and per-key usage visibility.",
    icon: IconLock,
  },
];

const EVAL_ROWS = [
  { model: "gradient_boosting-v2.0.0", score: "0.91", status: "PASSED" },
  { model: "logistic-regression-v1.4.2", score: "0.84", status: "PASSED" },
  { model: "support-agent-v4", score: "0.88", status: "PASSED" },
];

const AUDIT_FEED = [
  { time: "12:41", event: "prediction served", detail: "support-agent cohort · score 7.2", tone: "ok" },
  { time: "12:37", event: "drift check", detail: "Dosage_mg PSI 0.11 · within baseline", tone: "ok" },
  { time: "12:31", event: "quota guard", detail: "free tier 4/5 requests this month", tone: "warn" },
  { time: "12:18", event: "model promoted", detail: "gradient_boosting-v2.0.0 → PRODUCTION", tone: "ok" },
];

function EvalsCard() {
  return (
    <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] shadow-[0_12px_32px_rgba(20,20,23,0.06)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--cv-border)] px-5 py-3.5">
        <span className="text-caption font-mono text-[var(--cv-text-secondary)]">
          evals — support-agent-v4
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-caption font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          passed
        </span>
      </div>
      <ul className="divide-y divide-[var(--cv-border)]">
        {EVAL_ROWS.map((row) => (
          <li
            key={row.model}
            className="flex items-center justify-between gap-4 px-5 py-3.5"
          >
            <span className="font-mono text-label text-[var(--cv-text-primary)] truncate">
              {row.model}
            </span>
            <div className="flex items-center gap-4 shrink-0">
              <span className="font-mono text-caption tabular-nums text-[var(--cv-text-secondary)]">
                {row.score}
              </span>
              <Badge variant="success" size="sm">
                {row.status}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-[var(--cv-border)] px-5 py-4">
        <div className="flex items-center justify-between text-caption text-[var(--cv-text-secondary)] mb-2">
          <span className="font-mono">PII leakage</span>
          <span className="font-mono tabular-nums">0.00</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--cv-border)] overflow-hidden">
          <div className="h-full w-full rounded-full bg-[var(--cv-accent)]" />
        </div>
      </div>
    </div>
  );
}

function AuditCard() {
  return (
    <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] shadow-[0_12px_32px_rgba(20,20,23,0.06)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--cv-border)] px-5 py-3.5">
        <span className="text-caption font-mono text-[var(--cv-text-secondary)]">
          runtime audit — live feed
        </span>
        <Badge variant="success" dot size="sm">
          nominal
        </Badge>
      </div>
      <ul className="divide-y divide-[var(--cv-border)] px-5">
        {AUDIT_FEED.map((row) => (
          <li
            key={row.time + row.event}
            className="flex items-start gap-4 py-3.5"
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
      <div className="border-t border-[var(--cv-border)] px-5 py-4">
        <a
          href="/monitoring"
          className="inline-flex items-center gap-1.5 text-label font-medium text-[var(--cv-text-primary)] hover:underline underline-offset-4"
        >
          Open live monitoring
          <IconArrowUpRight size={15} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export function PlatformSection() {
  return (
    <section className="border-t border-[var(--cv-border)] bg-[var(--cv-canvas)]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28 space-y-20 sm:space-y-28">
        {/* Audience overview — 3-column with top rules + circular badges */}
        <div className="space-y-10">
          <div className="max-w-[65ch] space-y-4">
            <p className="text-caption font-medium uppercase tracking-[0.14em] text-[var(--cv-text-secondary)]">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
            {AUDIENCES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="border-t border-[var(--cv-border)] pt-6 space-y-4">
                  <span className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--cv-accent)] text-[var(--cv-on-accent)]">
                    <Icon size={20} stroke={1.8} aria-hidden="true" />
                  </span>
                  <h3 className="text-heading text-[var(--cv-text-primary)]">
                    {item.title}
                  </h3>
                  <p className="text-body text-[var(--cv-text-secondary)]">
                    {item.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alternating feature splits */}
        <div className="space-y-20 sm:space-y-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-5">
              <p className="text-caption font-medium uppercase tracking-[0.14em] text-[var(--cv-text-secondary)]">
                Governance &amp; audit
              </p>
              <h3 className="text-title text-[var(--cv-text-primary)]">
                Every score is reproducible, attributable, and logged
              </h3>
              <p className="text-body text-[var(--cv-text-secondary)] max-w-[52ch]">
                Predictions return point estimates with 95% confidence
                intervals and per-feature attribution. Every inference lands
                in an append-only audit trail you can replay months later.
              </p>
              <a
                href="/scoring"
                className="inline-flex items-center gap-1.5 pt-2 text-label font-medium text-[var(--cv-text-primary)] hover:underline underline-offset-4"
              >
                Try scoring
                <IconArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
            <EvalsCard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="lg:order-2 space-y-5">
              <p className="text-caption font-medium uppercase tracking-[0.14em] text-[var(--cv-text-secondary)]">
                Runtime security
              </p>
              <h3 className="text-title text-[var(--cv-text-primary)]">
                Drift detection runs on every production cohort
              </h3>
              <p className="text-body text-[var(--cv-text-secondary)] max-w-[52ch]">
                KS and PSI tests compare live feature distributions against
                the training baseline hourly. Alerts surface before a
                degraded model reaches a patient.
              </p>
              <a
                href="/monitoring"
                className="inline-flex items-center gap-1.5 pt-2 text-label font-medium text-[var(--cv-text-primary)] hover:underline underline-offset-4"
              >
                View monitoring
                <IconArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
            <div className="lg:order-1">
              <AuditCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
