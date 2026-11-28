"use client";

import * as React from "react";
import { IconChartBar, IconRefresh } from "@tabler/icons-react";
import { Badge } from "@/components/wensity/badge";
import { Button } from "@/components/wensity/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/wensity/card";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/wensity/data-table";
import { EmptyState } from "@/components/wensity/empty-state";
import { Separator } from "@/components/wensity/separator";
import {
  LatencyPercentilesChart,
  DriftMetricsChart,
} from "@/components/charts/ClinicalCharts";
import type {
  AuditLogEntry,
  DriftMetrics,
  TelemetryMetrics,
} from "@/lib/api";

type AuditRow = {
  id: string;
  timestampFormatted: string;
  modelId: string;
  scoreText: string;
  effectiveness: string;
  latencyText: string;
};

const AUDIT_COLUMNS: DataTableColumn<AuditRow>[] = [
  {
    id: "timestampFormatted",
    header: "Timestamp",
    accessorKey: "timestampFormatted",
    sortable: true,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-[var(--cv-text-secondary)]">
        {row.timestampFormatted}
      </span>
    ),
  },
  {
    id: "modelId",
    header: "Serving model",
    accessorKey: "modelId",
    sortable: true,
    cell: ({ row }) => (
      <span className="font-mono text-[var(--cv-text-primary)] truncate max-w-[200px] block">
        {row.modelId}
      </span>
    ),
  },
  {
    id: "scoreText",
    header: "Score",
    accessorKey: "scoreText",
    sortable: true,
    cell: ({ row }) => (
      <span className="block text-end font-mono font-semibold tabular-nums text-[var(--cv-text-primary)]">
        {row.scoreText}
      </span>
    ),
  },
  {
    id: "effectiveness",
    header: "Efficacy",
    accessorKey: "effectiveness",
    sortable: true,
    cell: ({ row }) => (
      <Badge
        variant={
          row.effectiveness === "High"
            ? "success"
            : row.effectiveness === "Medium"
              ? "info"
              : row.effectiveness === "Low"
                ? "warning"
                : "neutral"
        }
        size="sm"
      >
        {row.effectiveness}
      </Badge>
    ),
  },
  {
    id: "latencyText",
    header: "Latency",
    accessorKey: "latencyText",
    sortable: true,
    cell: ({ row }) => (
      <span className="block text-end font-mono tabular-nums text-[var(--cv-text-secondary)]">
        {row.latencyText}
      </span>
    ),
  },
];

export function MonitoringTab({
  telemetry,
  drift,
  auditLogs,
  onRefresh,
}: {
  telemetry: TelemetryMetrics | null;
  drift: DriftMetrics | null;
  auditLogs: AuditLogEntry[];
  onRefresh?: () => Promise<void>;
}) {
  const [refreshing, setRefreshing] = React.useState(false);

  async function handleRefresh() {
    if (!onRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  const auditRows: AuditRow[] = React.useMemo(
    () =>
      auditLogs.map((entry, idx) => ({
        id: `${entry.timestamp}-${idx}`,
        timestampFormatted: new Date(entry.timestamp).toLocaleTimeString(),
        modelId: entry.model_id ?? "N/A",
        scoreText:
          entry.predicted_score !== undefined
            ? Number(entry.predicted_score).toFixed(2)
            : "Err",
        effectiveness: entry.effectiveness ?? "COMPLETED",
        latencyText: `${entry.latency_ms ?? 0} ms`,
      })),
    [auditLogs],
  );

  const categoricalEntries = Object.entries(drift?.categorical_metrics ?? {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-4">
        {onRefresh && (
          <Button
            variant="outline"
            size="md"
            loading={refreshing}
            leftIcon={<IconRefresh size={16} />}
            onClick={() => void handleRefresh()}
            className="min-h-[44px]"
          >
            Refresh telemetry
          </Button>
        )}
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 space-y-1">
            <div className="text-caption text-[var(--cv-text-secondary)]">
              Total live inferences
            </div>
            <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
              {(telemetry?.total_inferences ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-1">
            <div className="text-caption text-[var(--cv-text-secondary)]">
              System throughput
            </div>
            <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
              {telemetry?.throughput_req_per_min ?? 0} rpm
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-1">
            <div className="text-caption text-[var(--cv-text-secondary)]">
              Error rate
            </div>
            <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
              {telemetry?.error_rate_pct ?? 0}%
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-heading">
              Latency percentiles (ms)
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-heading">
              Kolmogorov-Smirnov drift test
            </CardTitle>
            <span className="text-caption font-mono text-[var(--cv-text-secondary)]">
              p &lt; 0.05 indicates drift
            </span>
          </CardHeader>
          <CardContent>
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
                description="Distribution statistics render once reference features are compared."
                className="py-6"
              />
            )}
          </CardContent>
        </Card>
      </section>

      {categoricalEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-heading">
              Categorical PSI stability
            </CardTitle>
            <CardDescription>
              Population Stability Index across categorical inputs (PSI &gt; 0.25
              signals significant shift).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categoricalEntries.map(([feature, metric]) => (
              <div
                key={feature}
                className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="font-mono text-label text-[var(--cv-text-primary)] truncate">
                    {feature}
                  </div>
                  <div className="font-mono text-caption tabular-nums text-[var(--cv-text-secondary)]">
                    PSI: {metric.psi.toFixed(4)}
                  </div>
                </div>
                <Badge
                  variant={metric.drift_detected ? "warning" : "success"}
                  size="sm"
                >
                  {metric.status ?? (metric.drift_detected ? "Shift" : "Stable")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-heading">
            Live inference audit trail
          </CardTitle>
          <CardDescription>
            Recent clinical scoring requests and execution durations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          {auditRows.length > 0 ? (
            <DataTable<AuditRow>
              columns={AUDIT_COLUMNS}
              data={auditRows}
              sortable
              filterable
              paginated={{ pageSize: 10 }}
              density="compact"
              stickyHeader
            />
          ) : (
            <EmptyState
              title="No inference events recorded"
              description="Run a prediction to populate the live audit trail."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
