"use client";

import * as React from "react";

const PIPELINE_STAGES = [
  {
    step: "01",
    layer: "Edge & ingress",
    title: "Cloudflare Worker and FastAPI gateway",
    summary:
      "Caches public clinical metadata and deterministic SHA-256 single predictions while enforcing CORS, security headers, and tiered X-API-Key rate limits.",
  },
  {
    step: "02",
    layer: "Validation & encoding",
    title: "Clinical bounds and ColumnTransformer",
    summary:
      "Verifies Age (1 to 120), Dosage (5 to 2,000 mg), Duration (1 to 365 days), and approved Indication-to-Compound pairs before StandardScaler and OneHotEncoder transforms.",
  },
  {
    step: "03",
    layer: "Inference & attribution",
    title: "Serialized .joblib pipeline and XAI",
    summary:
      "Scores expected improvement (1.0 to 10.0), computes calibrated 95% confidence bounds (±1.96 × RMSE), and returns per-feature local attribution impacts.",
  },
  {
    step: "04",
    layer: "Governance & drift",
    title: "Model registry and KS/PSI observability",
    summary:
      "Logs every prediction to an append-only JSONL audit trail, runs 2-sample Kolmogorov-Smirnov and PSI drift checks, and governs STAGING to PRODUCTION promotion.",
  },
];

export function ArchitectureSection() {
  return (
    <section
      id="architecture"
      className="border-t border-[var(--cv-border)] bg-[var(--cv-canvas)] py-16 sm:py-24 lg:py-28 scroll-mt-20"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <h2 className="text-display leading-[1.05] tracking-[-0.03em] text-[var(--cv-text-primary)] pb-12 sm:pb-16">
          End-to-end clinical inference pipeline
        </h2>
        <ol className="border-t border-[var(--cv-border)]">
          {PIPELINE_STAGES.map((stage) => (
            <li
              key={stage.step}
              className="grid grid-cols-1 gap-4 border-b border-[var(--cv-border)] py-8 sm:grid-cols-12 sm:gap-8 sm:py-10"
            >
              <div className="sm:col-span-2">
                <span className="font-mono text-title tabular-nums text-[var(--cv-text-secondary)]">
                  {stage.step}
                </span>
              </div>

              <div className="sm:col-span-4 min-w-0 space-y-3">
                <p className="text-caption font-medium uppercase tracking-[0.14em] text-[var(--cv-text-secondary)]">
                  {stage.layer}
                </p>
                <h3 className="text-heading text-[var(--cv-text-primary)]">
                  {stage.title}
                </h3>
              </div>

              <div className="sm:col-span-6 min-w-0 space-y-4">
                <p className="text-body text-[var(--cv-text-secondary)] max-w-[58ch]">
                  {stage.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
