"use client";

import * as React from "react";
import { IconDownload, IconPlayerPlay, IconTable } from "@tabler/icons-react";
import { Alert } from "@/components/wensity/alert";
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
import { FileUploader } from "@/components/wensity/file-uploader";
import { Progress } from "@/components/wensity/progress";
import { useToastManager } from "@/components/wensity/toast";
import { curavexApi, type BatchPredictionResponse } from "@/lib/api";
import { formatConfidenceInterval } from "@/lib/clinical-validation";

type BatchRow = {
  id: string;
  subjectNumber: number;
  predicted_score: number;
  effectiveness_level: string;
  confidenceIntervalText: string;
};

const BATCH_COLUMNS: DataTableColumn<BatchRow>[] = [
  {
    id: "subjectNumber",
    header: "Subject",
    accessorKey: "subjectNumber",
    sortable: true,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-[var(--cv-text-secondary)]">
        #{row.subjectNumber}
      </span>
    ),
  },
  {
    id: "predicted_score",
    header: "Predicted score",
    accessorKey: "predicted_score",
    sortable: true,
    cell: ({ row }) => (
      <span className="block text-end font-mono font-semibold tabular-nums text-[var(--cv-text-primary)]">
        {row.predicted_score.toFixed(2)}
      </span>
    ),
  },
  {
    id: "effectiveness_level",
    header: "Efficacy tier",
    accessorKey: "effectiveness_level",
    sortable: true,
    cell: ({ row }) => (
      <Badge
        variant={
          row.effectiveness_level === "High"
            ? "success"
            : row.effectiveness_level === "Medium"
              ? "info"
              : "warning"
        }
        size="sm"
      >
        {row.effectiveness_level}
      </Badge>
    ),
  },
  {
    id: "confidenceIntervalText",
    header: "95% confidence interval",
    accessorKey: "confidenceIntervalText",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-[var(--cv-text-secondary)] slashed-zero">
        {row.confidenceIntervalText}
      </span>
    ),
  },
];

export function BatchTab() {
  const toast = useToastManager();
  const [batchResult, setBatchResult] =
    React.useState<BatchPredictionResponse | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isRunningSample, setIsRunningSample] = React.useState(false);

  async function handleFileUpload(
    file: File,
    onProgress: (percent: number) => void,
  ) {
    setErrorMessage(null);
    setStatusMessage(`Scoring ${file.name}…`);
    onProgress(35);

    try {
      const data = await curavexApi.uploadBatchCsv(file);
      onProgress(100);
      setBatchResult(data);
      const msg = `Scored ${data.total_processed} patient records in ${data.batch_latency_ms} ms.`;
      setStatusMessage(msg);
      toast.add({
        title: "Cohort scored",
        description: msg,
        data: { variant: "success" },
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Batch upload failed. Verify CSV columns and try again.";
      setErrorMessage(message);
      setStatusMessage(null);
      toast.add({
        title: "Cohort upload failed",
        description: message,
        data: { variant: "error" },
      });
      throw err;
    }
  }

  async function handleRunSampleCohort() {
    if (isRunningSample) return;
    setIsRunningSample(true);
    setErrorMessage(null);
    try {
      const res = await fetch("./demo_batch_cohort.csv");
      if (!res.ok) throw new Error("Could not load sample cohort CSV.");
      const csvText = await res.text();
      const sampleFile = new File([csvText], "demo_batch_cohort.csv", {
        type: "text/csv",
      });
      await handleFileUpload(sampleFile, () => undefined);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not score sample cohort.",
      );
    } finally {
      setIsRunningSample(false);
    }
  }

  const rows: BatchRow[] = React.useMemo(
    () =>
      (batchResult?.predictions ?? []).map((item, idx) => ({
        id: `subject-${idx + 1}`,
        subjectNumber: idx + 1,
        predicted_score: item.predicted_score,
        effectiveness_level: item.effectiveness_level,
        confidenceIntervalText: formatConfidenceInterval(item.confidence_interval),
      })),
    [batchResult],
  );

  const dist = batchResult?.effectiveness_distribution;
  const total = batchResult?.total_processed ?? 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-title">Score a cohort from CSV</CardTitle>
            <CardDescription className="max-w-[65ch]">
              Upload a CSV with Age, Gender, Condition, Drug_Name, Dosage_mg, and
              Treatment_Duration_days columns, or run the 10-subject sample file.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="default"
              size="md"
              loading={isRunningSample}
              leftIcon={<IconPlayerPlay size={16} />}
              onClick={() => void handleRunSampleCohort()}
              className="min-h-[44px]"
            >
              Score sample cohort
            </Button>
            <Button variant="outline" size="md" asChild className="min-h-[44px]">
              <a href="./demo_batch_cohort.csv" download>
                <IconDownload size={16} />
                <span>Download template</span>
              </a>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <FileUploader
            accept=".csv"
            maxFiles={1}
            color="#3f3f46"
            buttonLabel="Select cohort CSV"
            description="or drop a .csv file here"
            onUpload={handleFileUpload}
          />

          {statusMessage && (
            <Alert
              variant="success"
              title="Cohort scored"
              description={statusMessage}
            />
          )}

          {errorMessage && (
            <Alert
              variant="error"
              title="Cohort upload failed"
              description={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-6">
          {batchResult ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-canvas)] p-4 space-y-1">
                  <div className="text-caption text-[var(--cv-text-secondary)]">
                    Processed cohort
                  </div>
                  <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
                    {batchResult.total_processed}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-canvas)] p-4 space-y-1">
                  <div className="text-caption text-[var(--cv-text-secondary)]">
                    Mean score
                  </div>
                  <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
                    {batchResult.mean_predicted_score.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-canvas)] p-4 space-y-1">
                  <div className="text-caption text-[var(--cv-text-secondary)]">
                    Minimum score
                  </div>
                  <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
                    {batchResult.min_predicted_score.toFixed(2)}
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-canvas)] p-4 space-y-1">
                  <div className="text-caption text-[var(--cv-text-secondary)]">
                    Maximum score
                  </div>
                  <div className="text-title tabular-nums text-[var(--cv-text-primary)]">
                    {batchResult.max_predicted_score.toFixed(2)}
                  </div>
                </div>
              </div>

              {dist && total > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4">
                  {(["High", "Medium", "Low"] as const).map((tier) => {
                    const count = dist[tier] ?? 0;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={tier} className="space-y-1.5">
                        <div className="flex items-center justify-between text-caption">
                          <span className="font-medium text-[var(--cv-text-primary)]">
                            {tier} efficacy
                          </span>
                          <span className="font-mono tabular-nums text-[var(--cv-text-secondary)]">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          max={100}
                          size="sm"
                          tone={
                            tier === "High"
                              ? "success"
                              : tier === "Medium"
                                ? "brand"
                                : "warning"
                          }
                          label={`${tier} efficacy share`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <DataTable<BatchRow>
                columns={BATCH_COLUMNS}
                data={rows}
                sortable
                filterable
                paginated={{ pageSize: 10 }}
                density="compact"
                stickyHeader
              />
            </>
          ) : (
            <EmptyState
              icon={
                <IconTable
                  size={28}
                  stroke={1.6}
                  className="text-[var(--cv-text-secondary)]"
                />
              }
              title="Cohort results will appear here"
              description="Upload a clinical CSV above or click Score sample cohort to evaluate 10 patient trajectories."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
