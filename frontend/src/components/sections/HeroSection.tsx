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

const SCAN_LINES = [
  { target: "model-registry", detail: "gradient_boosting-v2.0.0-c31272 · PRODUCTION" },
  { target: "predict", detail: "SHA-256 payload cache · deterministic" },
  { target: "drift-detector", detail: "KS-test + PSI · hourly baseline" },
  { target: "audit-log", detail: "append-only JSONL · 200 entries" },
  { target: "quota-guard", detail: "monthly allowance · per-user D1 counter" },
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
    <section className="bg-[#0a0a0a] text-[#f4f4f5]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-7 min-w-0 space-y-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-caption text-[#d4d4d4]">
                <span
                  className={`size-1.5 rounded-full ${
                    apiStatus === "live"
                      ? "bg-emerald-400"
                      : apiStatus === "connecting"
                        ? "bg-sky-400"
                        : "bg-amber-400"
                  }`}
                />
                {apiStatus === "live"
                  ? "Edge live"
                  : apiStatus === "connecting"
                    ? "Connecting"
                    : "Reference mode"}
              </span>
              <span className="text-caption font-mono text-[#a8a8a8]">
                {activeModel?.model_id ?? "gradient_boosting-v2.0.0-c31272"}
              </span>
            </div>

            <h1 className="text-display text-white max-w-[15ch]">
              Score every patient. Govern every model.
            </h1>

            <p className="text-body text-[#a8a8a8] max-w-[56ch]">
              Curavex predicts clinical treatment response from regimen
              parameters, scores multi-subject cohorts, and monitors statistical
              drift across every prediction in production.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onStartScoring}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-6 py-2.5 text-label font-semibold text-black transition-opacity hover:opacity-90 cursor-pointer"
              >
                <span>Score a patient</span>
                <IconArrowDownRight size={16} stroke={2} aria-hidden="true" />
              </button>
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("architecture")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-label text-white hover:border-white/50 transition-colors"
              >
                <span>Inspect architecture</span>
                <IconArrowUpRight size={16} stroke={2} aria-hidden="true" />
              </a>
            </div>

            <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-white/10">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <div className="text-caption text-[#a8a8a8]">{stat.label}</div>
                  <div className="text-title tabular-nums text-white">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 min-w-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
                <span className="text-caption font-mono text-[#a8a8a8]">
                  edge-scan · curavex-api
                </span>
                <span className="inline-flex items-center gap-1.5 text-caption font-mono text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  scanning
                </span>
              </div>

              <ul className="divide-y divide-white/5">
                {SCAN_LINES.map((line, i) => (
                  <li
                    key={line.target}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-label text-white truncate">
                        {line.target}
                      </div>
                      <div className="text-caption text-[#a8a8a8] truncate">
                        {line.detail}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md border border-white/10 px-2 py-0.5 font-mono text-caption text-[#a8a8a8]">
                      ok
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-white/10 px-5 py-3.5 flex items-center justify-between gap-4 text-caption font-mono text-[#a8a8a8]">
                <span>
                  drift:{" "}
                  {drift?.overall_drift_detected ? "ALERT" : "stable"}
                </span>
                <span className="tabular-nums">
                  {totalInferences.toLocaleString()} served
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {CLINICAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-white/15 px-4 py-2 text-caption font-medium text-[#d4d4d4] hover:border-white/40 hover:text-white transition-colors cursor-pointer"
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
