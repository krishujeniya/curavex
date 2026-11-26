"use client";

import * as React from "react";
import { Badge } from "@/components/wensity/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/wensity/card";

const PIPELINE_STAGES = [
  {
    step: "01",
    layer: "Edge & Ingress",
    title: "Cloudflare Worker + FastAPI Gateway",
    summary:
      "Edge-caches public clinical metadata and deterministic SHA-256 single predictions while enforcing CORS, security headers, and tiered X-API-Key rate limits.",
    artifacts: ["deploy/edge/worker.ts", "backend/src/api/main.py"],
  },
  {
    step: "02",
    layer: "Validation & Encoding",
    title: "Clinical Bounds & ColumnTransformer",
    summary:
      "Verifies Age (1–120), Dosage (5–2,000 mg), Duration (1–365 days), and approved Indication-to-Compound pairs before StandardScaler + OneHotEncoder transforms.",
    artifacts: ["backend/src/data/validator.py", "backend/src/features/build_features.py"],
  },
  {
    step: "03",
    layer: "Inference & XAI",
    title: "Serialized .joblib Pipeline + Attribution",
    summary:
      "Scores expected improvement (1.0–10.0), computes calibrated 95% confidence bounds (±1.96 × RMSE), and returns per-feature local attribution impacts.",
    artifacts: ["backend/src/models/predict_model.py", "backend/src/explainability/attributions.py"],
  },
  {
    step: "04",
    layer: "Governance & Drift",
    title: "Model Registry + KS/PSI Observability",
    summary:
      "Logs every prediction to an append-only JSONL audit trail, runs 2-sample Kolmogorov-Smirnov and PSI drift checks, and governs STAGING to PRODUCTION promotion.",
    artifacts: ["backend/src/models/registry.py", "backend/src/monitoring/drift_detector.py"],
  },
];

export function ArchitectureSection() {
  return (
    <section
      id="architecture"
      className="border-t border-[var(--cv-border)] py-12 sm:py-16 lg:py-24"
      style={{ background: "var(--cv-grad-section)" }}
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-3 max-w-[65ch]">
            <h2 className="font-[family-name:var(--font-display)] text-title text-[var(--cv-text-primary)]">
              End-to-end clinical inference architecture
            </h2>
            <p className="text-body text-[var(--cv-text-secondary)]">
              Every prediction passes through deterministic edge caching, schema
              validation, calibrated ensemble regression, and continuous statistical
              drift auditing.
            </p>
          </div>
          <Badge variant="outline" size="md">
            Static SPA · FastAPI · scikit-learn
          </Badge>
        </div>

        <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 sm:p-6 lg:p-8 shadow-[var(--cv-shadow-elev)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {PIPELINE_STAGES.map((stage) => (
              <Card
                key={stage.step}
                className="border-[var(--cv-border)]"
                style={{ background: "var(--cv-grad-card)" }}
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-caption text-[var(--cv-text-secondary)]">
                      {stage.step} · {stage.layer}
                    </span>
                    <Badge variant="neutral" size="sm">
                      Verified
                    </Badge>
                  </div>
                  <CardTitle className="text-heading">{stage.title}</CardTitle>
                  <CardDescription className="text-body">
                    {stage.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  {stage.artifacts.map((path) => (
                    <code
                      key={path}
                      className="rounded-md border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2 py-1 font-mono text-caption text-[var(--cv-text-secondary)]"
                    >
                      {path}
                    </code>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
