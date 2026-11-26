"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/wensity/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/wensity/card";
import { Progress } from "@/components/wensity/progress";
import type { DatasetStats } from "@/lib/api";

const GLOBAL_FEATURE_IMPORTANCES = [
  { feature: "Treatment_Duration_days", label: "Treatment duration (days)", pct: 33.19 },
  { feature: "Age", label: "Patient age", pct: 30.37 },
  { feature: "Drug_Name", label: "Approved compound", pct: 20.52 },
  { feature: "Dosage_mg", label: "Unit dosage (mg)", pct: 8.75 },
  { feature: "Condition", label: "Primary indication", pct: 5.15 },
  { feature: "Gender", label: "Biological sex", pct: 2.02 },
];

const METHODOLOGY_FAQS = [
  {
    id: "score-scale",
    question: "How should the predicted improvement score be interpreted?",
    answer:
      "Scores range from 1.0 to 10.0 on the canonical clinical endpoint scale. Curavex maps predictions into three tiers: Low (1.0 to 4.5), Medium (4.6 to 7.5), and High (7.6 to 10.0). Estimates are cohort-calibrated decision-support signals, not standalone medical diagnoses.",
  },
  {
    id: "confidence-interval",
    question: "How is the 95% confidence interval calculated?",
    answer:
      "Each prediction returns a 95% interval derived from the active model's holdout RMSE (±1.96 × RMSE, clamped to [0.0, 10.0]). Displaying the interval alongside the point estimate prevents over-reliance on single-number outputs.",
  },
  {
    id: "drift-monitoring",
    question: "How do Kolmogorov-Smirnov and PSI drift detection work?",
    answer:
      "Numeric features (Age, Dosage_mg, Treatment_Duration_days) are evaluated with a 2-sample Kolmogorov-Smirnov test against the training baseline (p < 0.05 flags drift). Categorical features (Gender, Condition, Drug_Name) use Population Stability Index (PSI > 0.25 indicates significant shift).",
  },
  {
    id: "edge-caching",
    question: "What does the Cloudflare Worker edge proxy cache?",
    answer:
      "The edge worker caches public clinical metadata (/api/v1/metadata/clinical) and deterministic SHA-256 hashes of single prediction payloads (/api/v1/predict), while forcing Cache-Control: no-store on API key management and audit log endpoints.",
  },
];

export function MethodologySection({
  datasetStats,
}: {
  datasetStats: DatasetStats | null;
}) {
  const conditions = datasetStats?.condition_distribution ?? {
    Infection: 215,
    "Pain Relief": 208,
    Diabetes: 207,
    Hypertension: 194,
    Depression: 176,
  };
  const total = datasetStats?.total_records ?? 1000;

  return (
    <section
      id="methodology"
      className="border-t border-[var(--cv-border)] py-12 sm:py-16 lg:py-24"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="space-y-3 max-w-[65ch]">
          <h2 className="font-[family-name:var(--font-display)] text-title text-[var(--cv-text-primary)]">
            Cohort baseline &amp; methodology
          </h2>
          <p className="text-body text-[var(--cv-text-secondary)]">
            Global feature weights for the production Gradient Boosting model and
            reference distribution across the {total.toLocaleString()} trial subjects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 min-w-0 space-y-6">
            <Card style={{ background: "var(--cv-grad-card)" }}>
              <CardHeader>
                <CardTitle className="text-heading">
                  Global feature importance (v2.0.0)
                </CardTitle>
                <CardDescription>
                  Aggregated split importance across encoded clinical features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {GLOBAL_FEATURE_IMPORTANCES.map((item) => (
                  <div key={item.feature} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-caption">
                      <span className="font-medium text-[var(--cv-text-primary)]">
                        {item.label}
                      </span>
                      <span className="font-mono tabular-nums text-[var(--cv-text-secondary)]">
                        {item.pct.toFixed(2)}%
                      </span>
                    </div>
                    <Progress
                      value={item.pct}
                      max={40}
                      size="sm"
                      tone="neutral"
                      label={item.label}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card style={{ background: "var(--cv-grad-card)" }}>
              <CardHeader>
                <CardTitle className="text-heading">
                  Canonical cohort distribution
                </CardTitle>
                <CardDescription>
                  Balanced indication coverage across {total.toLocaleString()} validated
                  patient records.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(conditions).map(([name, count]) => (
                  <div
                    key={name}
                    className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-3 space-y-1"
                  >
                    <div className="text-caption text-[var(--cv-text-secondary)] truncate">
                      {name}
                    </div>
                    <div className="font-mono text-heading tabular-nums text-[var(--cv-text-primary)]">
                      {count}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-6 min-w-0">
            <Card style={{ background: "var(--cv-grad-card)" }}>
              <CardHeader>
                <CardTitle className="text-heading">
                  Clinical &amp; statistical questions
                </CardTitle>
                <CardDescription>
                  Direct answers on calibration, drift thresholds, and edge behavior.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" variant="faq" defaultValue="score-scale">
                  {METHODOLOGY_FAQS.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
