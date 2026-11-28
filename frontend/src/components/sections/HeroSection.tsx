"use client";

import * as React from "react";
import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
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

const RADAR_NODES = [
  { label: "support-agent", top: "18%", left: "62%" },
  { label: "treatment-planner", top: "58%", left: "78%" },
  { label: "triage-v3", top: "66%", left: "30%" },
];

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
  const p50Latency = telemetry?.latency_ms?.p50 ?? 0;
  const totalInferences = telemetry?.total_inferences ?? 0;

  const stats = [
    { label: "Trial subjects", value: totalRecords.toLocaleString() },
    { label: "Indications", value: String(conditionCount) },
    { label: "p50 latency", value: `${p50Latency.toFixed(1)} ms` },
    { label: "Inferences served", value: totalInferences.toLocaleString() },
  ];

  return (
    <section className="border-b border-[var(--cv-border)] bg-[var(--cv-canvas)]">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-28 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 min-w-0 space-y-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-1 text-caption text-[var(--cv-text-secondary)]">
                <span
                  className={`size-1.5 rounded-full ${
                    apiStatus === "live"
                      ? "bg-emerald-500"
                      : apiStatus === "connecting"
                        ? "bg-sky-500"
                        : "bg-amber-500"
                  }`}
                />
                {apiStatus === "live"
                  ? "Edge live"
                  : apiStatus === "connecting"
                    ? "Connecting"
                    : "Reference mode"}
              </span>
              <span className="text-caption font-mono text-[var(--cv-text-secondary)]">
                {activeModel?.model_id ?? "gradient_boosting-v2.0.0-c31272"}
              </span>
            </div>

            <h1 className="text-display text-[var(--cv-text-primary)] max-w-[16ch]">
              Score every patient. Govern every model.
            </h1>

            <p className="text-body text-[var(--cv-text-secondary)] max-w-[56ch]">
              Curavex predicts clinical treatment response from regimen
              parameters, scores multi-subject cohorts, and monitors
              statistical drift across every prediction in production.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onStartScoring}
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[var(--cv-accent)] px-6 py-2.5 text-label font-semibold text-[var(--cv-on-accent)] transition-opacity hover:opacity-90 cursor-pointer"
              >
                <span>Score a patient</span>
                <IconArrowDownRight size={16} stroke={2} aria-hidden="true" />
              </button>
              <a
                href="/#architecture"
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-[var(--cv-border)] px-5 py-2.5 text-label font-medium text-[var(--cv-text-primary)] hover:border-[var(--cv-border-strong)] transition-colors"
              >
                <span>Inspect architecture</span>
                <IconArrowUpRight size={16} stroke={2} aria-hidden="true" />
              </a>
            </div>

            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-[var(--cv-border)]">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="text-caption text-[var(--cv-text-secondary)]">
                    {stat.label}
                  </div>
                  <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 min-w-0">
            <div className="rounded-2xl border border-[var(--cv-border)] bg-[var(--cv-surface)] shadow-[0_12px_32px_rgba(20,20,23,0.06)] overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--cv-border)] px-5 py-3.5">
                <span className="text-caption font-mono text-[var(--cv-text-secondary)]">
                  runtime security — live
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-caption font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  scanning
                </span>
              </div>

              <div className="relative aspect-square w-full overflow-hidden bg-[var(--cv-canvas)]">
                <svg
                  viewBox="0 0 400 400"
                  className="absolute inset-0 size-full"
                  aria-hidden="true"
                >
                  {[60, 110, 160, 210].map((r) => (
                    <circle
                      key={r}
                      cx="200"
                      cy="200"
                      r={r}
                      fill="none"
                      stroke="var(--cv-border)"
                      strokeWidth="1"
                    />
                  ))}
                  <line x1="200" y1="0" x2="200" y2="400" stroke="var(--cv-border)" strokeWidth="1" />
                  <line x1="0" y1="200" x2="400" y2="200" stroke="var(--cv-border)" strokeWidth="1" />
                  <g
                    style={{
                      transformOrigin: "200px 200px",
                      animation: "cv-radar-sweep 4s linear infinite",
                    }}
                  >
                    <path
                      d="M200 200 L200 20 A180 180 0 0 1 320 95 Z"
                      fill="var(--cv-accent)"
                      opacity="0.08"
                    />
                    <line
                      x1="200"
                      y1="200"
                      x2="200"
                      y2="20"
                      stroke="var(--cv-accent)"
                      strokeWidth="1.5"
                      opacity="0.5"
                    />
                  </g>
                </svg>
                {RADAR_NODES.map((node) => (
                  <span
                    key={node.label}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 py-1 font-mono text-[10px] text-[var(--cv-text-secondary)] shadow-sm whitespace-nowrap"
                    style={{ top: node.top, left: node.left }}
                  >
                    {node.label}
                  </span>
                ))}
              </div>

              <div className="border-t border-[var(--cv-border)] px-5 py-4 flex items-center justify-between gap-4 text-caption font-mono text-[var(--cv-text-secondary)] tabular-nums">
                <span>
                  drift:{" "}
                  <span className={drift?.overall_drift_detected ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}>
                    {drift?.overall_drift_detected ? "ALERT" : "stable"}
                  </span>
                </span>
                <span>{totalInferences.toLocaleString()} inferences served</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {CLINICAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3.5 text-caption font-medium text-[var(--cv-text-secondary)] hover:border-[var(--cv-border-strong)] hover:text-[var(--cv-text-primary)] transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
