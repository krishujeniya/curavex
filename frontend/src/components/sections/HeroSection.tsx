"use client";

import * as React from "react";
import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import { Badge } from "@/components/wensity/badge";
import { Button } from "@/components/wensity/button";
import { Marker } from "@/components/wensity/marker";
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

  return (
    <section
      id="top"
      className="border-b border-[var(--cv-border)] bg-[var(--cv-surface)]"
    >
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 min-w-0 space-y-6">
            <h1 className="text-display text-[var(--cv-text-primary)] max-w-[18ch]">
              Predict clinical response with measurable drift control.
            </h1>

            <p className="text-body text-[var(--cv-text-secondary)] max-w-[60ch]">
              Score patient treatment trajectories, run batch CSV evaluations, and monitor clinical drift in production.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
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

            <div className="pt-2 space-y-2.5">
              <div className="text-caption text-[var(--cv-text-secondary)]">
                Load a clinical preset:
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

          <div className="lg:col-span-5 min-w-0">
            <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-canvas)] divide-y divide-[var(--cv-border)]">
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <h2 className="text-heading text-[var(--cv-text-primary)]">
                  System snapshot
                </h2>
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

              <div className="px-5 py-4 space-y-1">
                <div className="text-caption text-[var(--cv-text-secondary)]">
                  Serving model
                </div>
                <div className="font-mono text-label text-[var(--cv-text-primary)] truncate">
                  {activeModel?.model_id ?? "gradient_boosting-v2.0.0-c31272"}
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-[var(--cv-border)]">
                <div className="px-5 py-4 space-y-1">
                  <div className="text-caption text-[var(--cv-text-secondary)]">
                    Trial cohort
                  </div>
                  <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
                    {totalRecords.toLocaleString()}
                  </div>
                  <div className="text-caption text-[var(--cv-text-secondary)]">
                    {conditionCount} indications, 15 compounds
                  </div>
                </div>

                <div className="px-5 py-4 space-y-1">
                  <div className="text-caption text-[var(--cv-text-secondary)]">
                    Validation RMSE
                  </div>
                  <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
                    {rmseValue.toFixed(4)}
                  </div>
                  <div className="text-caption text-[var(--cv-text-secondary)]">
                    95% confidence interval
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-caption">
                <div className="flex items-center gap-2 tabular-nums text-[var(--cv-text-secondary)]">
                  <span>p50 latency:</span>
                  <span className="font-mono font-medium text-[var(--cv-text-primary)]">
                    {p50Latency.toFixed(1)} ms
                  </span>
                </div>
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
