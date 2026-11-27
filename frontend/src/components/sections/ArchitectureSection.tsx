"use client";

import * as React from "react";

const PIPELINE_STAGES = [
  {
    step: "01",
    layer: "Edge & ingress",
    title: "Cloudflare Worker and FastAPI gateway",
    summary:
      "Caches public clinical metadata and deterministic SHA-256 single predictions while enforcing CORS, security headers, and tiered X-API-Key rate limits.",
    artifacts: ["deploy/edge/worker.ts", "backend/src/api/main.py"],
  },
  {
    step: "02",
    layer: "Validation & encoding",
    title: "Clinical bounds and ColumnTransformer",
    summary:
      "Verifies Age (1 to 120), Dosage (5 to 2,000 mg), Duration (1 to 365 days), and approved Indication-to-Compound pairs before StandardScaler and OneHotEncoder transforms.",
    artifacts: [
      "backend/src/data/validator.py",
      "backend/src/features/build_features.py",
    ],
  },
  {
    step: "03",
    layer: "Inference & attribution",
    title: "Serialized .joblib pipeline and XAI",
    summary:
      "Scores expected improvement (1.0 to 10.0), computes calibrated 95% confidence bounds (±1.96 × RMSE), and returns per-feature local attribution impacts.",
    artifacts: [
      "backend/src/models/predict_model.py",
      "backend/src/explainability/attributions.py",
    ],
  },
  {
    step: "04",
    layer: "Governance & drift",
    title: "Model registry and KS/PSI observability",
    summary:
      "Logs every prediction to an append-only JSONL audit trail, runs 2-sample Kolmogorov-Smirnov and PSI drift checks, and governs STAGING to PRODUCTION promotion.",
    artifacts: [
      "backend/src/models/registry.py",
      "backend/src/monitoring/drift_detector.py",
    ],
  },
];

export function ArchitectureSection() {
  return (
    <section
      id="architecture"
      className="border-t border-[var(--cv-border)] bg-[var(--cv-canvas)] py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-3 max-w-[65ch]">
          <h2 className="text-title text-[var(--cv-text-primary)]">
            End-to-end clinical inference architecture
          </h2>
          <p className="text-body text-[var(--cv-text-secondary)]">
            Every prediction passes through deterministic edge caching, schema
            validation, calibrated ensemble regression, and continuous statistical
            drift auditing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border border-[var(--cv-border)] rounded-xl bg-[var(--cv-surface)] overflow-hidden divide-y md:divide-y-0">
          {PIPELINE_STAGES.map((stage, idx) => (
            <div
              key={stage.step}
              className={[
                "p-6 sm:p-8 flex flex-col justify-between gap-6 border-[var(--cv-border)]",
                idx % 2 === 1 ? "md:border-l" : "",
                idx >= 2 ? "md:border-t" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-caption text-[var(--cv-text-secondary)]">
                  <span className="font-mono tabular-nums font-medium text-[var(--cv-text-primary)]">
                    {stage.step}
                  </span>
                  <span>{stage.layer}</span>
                </div>
                <h3 className="text-heading text-[var(--cv-text-primary)]">
                  {stage.title}
                </h3>
                <p className="text-body text-[var(--cv-text-secondary)] max-w-[58ch]">
                  {stage.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {stage.artifacts.map((path) => (
                  <code
                    key={path}
                    className="rounded-md border border-[var(--cv-border)] bg-[var(--cv-canvas)] px-2.5 py-1 font-mono text-caption text-[var(--cv-text-secondary)]"
                  >
                    {path}
                  </code>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
