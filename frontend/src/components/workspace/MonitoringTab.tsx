"use client";

import * as React from "react";
import { IconChartBar } from "@tabler/icons-react";
import { EmptyState } from "@/components/wensity/empty-state";
import { Separator } from "@/components/wensity/separator";
import {
  DriftMetricsChart,
  LatencyPercentilesChart,
} from "@/components/charts/ClinicalCharts";
import type {
  AuditLogEntry,
  DriftMetrics,
  TelemetryMetrics,
} from "@/lib/api";

export function MonitoringTab({
  telemetry,
  drift,
  auditLogs,
}: {
  telemetry: TelemetryMetrics | null;
  drift: DriftMetrics | null;
  auditLogs: AuditLogEntry[];
}) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-1">
          <div className="text-caption text-[var(--cv-text-secondary)]">
            Total live inferences
          </div>
          <div className="text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
            {telemetry?.total_inferences ?? 0}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-1">
          <div className="text-caption text-[var(--cv-text-secondary)]">
            System throughput
          </div>
          <div className="text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
            {telemetry?.throughput_req_per_min ?? 0} rpm
          </div>
        </div>

        <div className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-1">
          <div className="text-caption text-[var(--cv-text-secondary)]">
            Error rate
          </div>
          <div className="text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
            {telemetry?.error_rate_pct ?? 0}%
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-4 min-w-0">
          <h2 className="text-heading text-[var(--cv-text-primary)]">
            Latency percentiles (ms)
          </h2>
          {telemetry?.latency_ms ? (
            <LatencyPercentilesChart latency={telemetry.latency_ms} />
          ) : (
            <EmptyState
              icon={
                <IconChartBar
                  size={24}
                  stroke={1.6}
                  className="text-[var(--cv-text-secondary)]"
                />
              }
              title="No latency samples yet"
              description="Inference latency percentiles appear after the first scoring request."
              className="py-6"
            />
          )}
        </div>

        <div className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-heading text-[var(--cv-text-primary)]">
              Kolmogorov-Smirnov drift test
            </h2>
            <span className="text-caption font-mono text-[var(--cv-text-secondary)]">
              p &lt; 0.05 indicates drift
            </span>
          </div>
          {drift?.numeric_metrics ? (
            <DriftMetricsChart numericMetrics={drift.numeric_metrics} />
          ) : (
            <EmptyState
              icon={
                <IconChartBar
                  size={24}
                  stroke={1.6}
                  className="text-[var(--cv-text-secondary)]"
                />
              }
              title="No drift telemetry yet"
              description="Distribution statistics will render once reference features are compared."
              className="py-6"
            />
          )}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-heading text-[var(--cv-text-primary)]">
            Live inference audit trail
          </h2>
          <p className="text-body text-[var(--cv-text-secondary)]">
            Recent clinical scoring requests and execution durations.
          </p>
        </div>

        <Separator />

        {auditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-[var(--cv-border)] text-label text-[var(--cv-text-secondary)]">
                  <th className="py-3 px-3 text-start">Timestamp</th>
                  <th className="py-3 px-3 text-start">Serving model</th>
                  <th className="py-3 px-3 text-end">Score</th>
                  <th className="py-3 px-3 text-start">Efficacy</th>
                  <th className="py-3 px-3 text-end">Latency</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((entry, idx) => (
                  <tr
                    key={`${entry.timestamp}-${idx}`}
                    className="border-b border-[var(--cv-border)]/60 hover:bg-white/[0.02] text-body"
                  >
                    <td className="py-3 px-3 font-mono tabular-nums text-[var(--cv-text-secondary)]">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-[var(--cv-text-primary)] truncate max-w-[180px]">
                      {entry.model_id ?? "N/A"}
                    </td>
                    <td className="py-3 px-3 text-end font-mono font-semibold tabular-nums text-[var(--cv-text-primary)]">
                      {entry.predicted_score ?? "Err"}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex rounded border border-[var(--cv-border-strong)] bg-[var(--cv-surface-raised)] px-2 py-0.5 text-caption font-mono text-[var(--cv-text-primary)]">
                        {entry.effectiveness ?? "COMPLETED"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-end font-mono tabular-nums text-[var(--cv-text-secondary)]">
                      {entry.latency_ms ?? 0} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No inference events recorded"
            description="Run a single or batch prediction to populate the live audit trail."
          />
        )}
      </section>
    </div>
  );
}
