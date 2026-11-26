"use client";

import * as React from "react";
import { IconTable } from "@tabler/icons-react";
import { Alert } from "@/components/wensity/alert";
import { EmptyState } from "@/components/wensity/empty-state";
import { FileUploader } from "@/components/wensity/file-uploader";
import { Separator } from "@/components/wensity/separator";
import { curavexApi, type BatchPredictionResponse } from "@/lib/api";

export function BatchTab() {
  const [batchResult, setBatchResult] =
    React.useState<BatchPredictionResponse | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

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
      setStatusMessage(
        `Scored ${data.total_processed} patient records in ${data.batch_latency_ms} ms.`,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Batch upload failed. Verify CSV columns and try again.";
      setErrorMessage(message);
      setStatusMessage(null);
      throw err;
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-title text-[var(--cv-text-primary)]">
              Score a cohort from CSV
            </h1>
            <p className="text-body text-[var(--cv-text-secondary)] max-w-[65ch]">
              Upload a multi-subject CSV with Age, Gender, Condition, Drug_Name,
              Dosage_mg, and Treatment_Duration_days columns.
            </p>
          </div>
          <a
            href="./demo_batch_cohort.csv"
            download
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-[var(--cv-border-strong)] bg-[var(--cv-surface-raised)] px-4 py-2 text-label text-[var(--cv-text-primary)] hover:border-[var(--cv-text-primary)] transition-colors whitespace-nowrap"
          >
            Download template CSV
          </a>
        </div>

        <FileUploader
          accept=".csv"
          maxFiles={1}
          color="#27272a"
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
      </section>

      <section className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-6">
        {batchResult ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-md border border-[var(--cv-border)] bg-[var(--cv-surface-raised)] p-4 space-y-1">
                <div className="text-caption text-[var(--cv-text-secondary)]">
                  Processed cohort
                </div>
                <div className="text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
                  {batchResult.total_processed}
                </div>
              </div>
              <div className="rounded-md border border-[var(--cv-border)] bg-[var(--cv-surface-raised)] p-4 space-y-1">
                <div className="text-caption text-[var(--cv-text-secondary)]">
                  Mean score
                </div>
                <div className="text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
                  {batchResult.mean_predicted_score.toFixed(2)}
                </div>
              </div>
              <div className="rounded-md border border-[var(--cv-border)] bg-[var(--cv-surface-raised)] p-4 space-y-1">
                <div className="text-caption text-[var(--cv-text-secondary)]">
                  Minimum score
                </div>
                <div className="text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
                  {batchResult.min_predicted_score.toFixed(2)}
                </div>
              </div>
              <div className="rounded-md border border-[var(--cv-border)] bg-[var(--cv-surface-raised)] p-4 space-y-1">
                <div className="text-caption text-[var(--cv-text-secondary)]">
                  Maximum score
                </div>
                <div className="text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
                  {batchResult.max_predicted_score.toFixed(2)}
                </div>
              </div>
            </div>

            <Separator />

            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="border-b border-[var(--cv-border)] text-label text-[var(--cv-text-secondary)]">
                    <th className="py-3 px-3 text-start">Subject</th>
                    <th className="py-3 px-3 text-end">Predicted score</th>
                    <th className="py-3 px-3 text-start">Efficacy tier</th>
                    <th className="py-3 px-3 text-end">
                      95% confidence interval
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {batchResult.predictions.slice(0, 15).map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-[var(--cv-border)]/60 hover:bg-white/[0.02] text-body"
                    >
                      <td className="py-3 px-3 font-mono tabular-nums text-[var(--cv-text-secondary)]">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-3 text-end font-mono font-semibold tabular-nums text-[var(--cv-text-primary)]">
                        {row.predicted_score.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex rounded border border-[var(--cv-border-strong)] bg-[var(--cv-surface-raised)] px-2 py-0.5 text-caption font-mono text-[var(--cv-text-primary)]">
                          {row.effectiveness_level}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end font-mono tabular-nums text-[var(--cv-text-secondary)]">
                        [{row.confidence_interval.join(" – ")}]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            description="Upload a clinical CSV above or download the template CSV to score a sample cohort."
          />
        )}
      </section>
    </div>
  );
}
