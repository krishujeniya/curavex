"use client";

import * as React from "react";
import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import { Badge } from "@/components/wensity/badge";
import { Button } from "@/components/wensity/button";
import { Marker } from "@/components/wensity/marker";
import { Separator } from "@/components/wensity/separator";
import type {
  DatasetStats,
  DriftMetrics,
  RegisteredModel,
  TelemetryMetrics,
} from "@/lib/api";
import {
  CLINICAL_PRESETS,
  type ClinicalCasePreset,
} from "@/lib/clinical-validation";

interface HeroSectionProps {
  activeModel: RegisteredModel | null;
  telemetry: TelemetryMetrics | null;
  drift: DriftMetrics | null;
  datasetStats: DatasetStats | null;
  apiStatus: "live" | "connecting" | "offline";
  onStartScoring: () => void;
  onSelectPreset: (preset: ClinicalCasePreset) => void;
}

export function HeroSection({
  activeModel,
  telemetry,
  drift,
  datasetStats,
  apiStatus,
  onStartScoring,
  onSelectPreset,
}: HeroSectionProps) {
  const totalRecords = datasetStats?.total_records ?? 1000;
  const conditionCount = datasetStats?.condition_distribution
    ? Object.keys(datasetStats.condition_distribution).length
    : 5;
  const rmseValue = activeModel?.metrics?.rmse ?? 1.4602;
  const p50Latency = telemetry?.latency_ms?.p50 ?? 0;

  const snapshotRows: Array<{ label: string; value: string; meta?: string }> = [
    {
      label: "Serving model",
      value: activeModel?.model_id ?? "gradient_boosting-v2.0.0-c31272",
      meta: "production registry",
    },
    {
      label: "Trial cohort",
      value: `${totalRecords.toLocaleString()} subjects`,
      meta: `${conditionCount} indications, 15 compounds`,
    },
    {
      label: "Validation RMSE",
      value: rmseValue.toFixed(4),
      meta: "95% confidence interval",
    },
    {
      label: "p50 latency",
      value: `${p50Latency.toFixed(1)} ms`,
      meta: "edge inference",
    },
  ];

  return (
    <section
      id="top"
      className="border-b border-[var(--cv-border)] bg-[var(--cv-surface)]"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-8 min-w-0 space-y-8">
            <p className="text-caption font-medium uppercase tracking-[0.18em] text-[var(--cv-text-secondary)]">
              Clinical treatment-response regression
            </p>

            <h1 className="text-display text-[var(--cv-text-primary)] max-w-[16ch]">
              Predict clinical response with measurable drift control.
            </h1>

            <p className="text-body text-[var(--cv-text-secondary)] max-w-[58ch]">
              Score patient treatment trajectories, run batch CSV evaluations,
              and monitor clinical drift in production.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="default"
                size="lg"
                rightIcon={<IconArrowDownRight size={17} />}
                onClick={onStartScoring}
                className="min-h-[44px]"
              >
                Score a patient
              </Button>
              <Button variant="outline" size="lg" asChild className="min-h-[44px]">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("architecture")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  <span>Inspect architecture</span>
                  <IconArrowUpRight size={16} />
                </a>
              </Button>
            </div>

            <div className="pt-6 space-y-4">
              <div className="text-caption text-[var(--cv-text-secondary)]">
                Or load a clinical preset:
              </div>
              <div className="flex flex-wrap gap-2">
                {CLINICAL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset)}
                    className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--cv-border)] bg-[var(--cv-canvas)] px-4 py-2 text-caption font-medium text-[var(--cv-text-primary)] hover:border-[var(--cv-accent)] transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 min-w-0">
            <div className="border border-[var(--cv-border)] bg-[var(--cv-canvas)]">
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--cv-border)]">
                <span className="text-caption font-medium uppercase tracking-[0.14em] text-[var(--cv-text-secondary)]">
                  System snapshot
                </span>
                <Marker
                  variant="status"
                  tone={
                    apiStatus === "live"
                      ? "success"
                      : apiStatus === "connecting"
                        ? "info"
                        : "warning"
                  }
                  label={
                    apiStatus === "live"
                      ? "Live API"
                      : apiStatus === "connecting"
                        ? "Connecting"
                        : "Reference mode"
                  }
                />
              </div>

              <dl className="divide-y divide-[var(--cv-border)]">
                {snapshotRows.map((row) => (
                  <div
                    key={row.label}
                    className="px-5 py-4 flex items-baseline justify-between gap-4"
                  >
                    <dt className="text-caption text-[var(--cv-text-secondary)] shrink-0">
                      {row.label}
                    </dt>
                    <dd className="text-right min-w-0">
                      <div className="font-mono text-label tabular-nums text-[var(--cv-text-primary)] truncate">
                        {row.value}
                      </div>
                      {row.meta && (
                        <div className="text-caption text-[var(--cv-text-secondary)] mt-0.5">
                          {row.meta}
                        </div>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <Separator />

              <div className="flex items-center justify-between gap-4 px-5 py-3.5 text-caption">
                <span className="text-[var(--cv-text-secondary)]">
                  Drift guard
                </span>
                <Badge
                  variant={
                    drift?.overall_drift_detected ? "warning" : "success"
                  }
                  dot
                >
                  {drift
                    ? drift.overall_drift_detected
                      ? `${drift.drifted_features_count ?? 1} drifted feature`
                      : "Distribution stable"
                    : "KS p < 0.05 guard"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
