"use client";

import * as React from "react";
import { IconChartBar, IconCpu } from "@tabler/icons-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/wensity/dialog";
import { EmptyState } from "@/components/wensity/empty-state";
import { Input } from "@/components/wensity/input";
import {
  ModelContextSwitcher,
  type ModelOption,
} from "@/components/wensity/model-context-switcher";
import { NativeSelect } from "@/components/wensity/native-select";
import { Separator } from "@/components/wensity/separator";
import { useToastManager } from "@/components/wensity/toast";
import {
  curavexApi,
  type BenchmarkReport,
  type RegisteredModel,
} from "@/lib/api";

type ModelRow = RegisteredModel & {
  id: string;
  rmseValue: number;
  [key: string]: unknown;
};

export function MlopsTab({
  models,
  activeModel,
  onModelsUpdated,
}: {
  models: RegisteredModel[];
  activeModel: RegisteredModel | null;
  onModelsUpdated: () => Promise<void>;
}) {
  const toast = useToastManager();
  const [promotingId, setPromotingId] = React.useState<string | null>(null);
  const [isRetrainOpen, setIsRetrainOpen] = React.useState(false);
  const [retrainAlgo, setRetrainAlgo] = React.useState("gradient_boosting");
  const [retrainVersion, setRetrainVersion] = React.useState("v2.1.0");
  const [isTraining, setIsTraining] = React.useState(false);
  const [isBenchmarking, setIsBenchmarking] = React.useState(false);
  const [benchmarks, setBenchmarks] = React.useState<
    Record<string, BenchmarkReport> | null
  >(null);
  const [feedback, setFeedback] = React.useState<{
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const modelSwitcherOptions: ModelOption[] = React.useMemo(
    () =>
      models.map((m) => ({
        id: m.model_id,
        label: `${m.algorithm.replace(/_/g, " ")} (${m.version})`,
        description: `RMSE ${m.metrics?.rmse ?? "N/A"} · ${m.status}`,
        badge: m.status === "PRODUCTION" ? "Live" : undefined,
      })),
    [models],
  );

  const handlePromote = React.useCallback(
    async (modelId: string) => {
      if (promotingId) return;
      setPromotingId(modelId);
      setFeedback(null);

      try {
        await curavexApi.promoteModel(modelId);
        await onModelsUpdated();
        const msg = `${modelId} is now serving production clinical traffic.`;
        setFeedback({
          variant: "success",
          title: "Model promoted",
          description: msg,
        });
        toast.add({
          title: "Model promoted",
          description: msg,
          data: { variant: "success" },
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not promote model.";
        setFeedback({
          variant: "error",
          title: "Promotion failed",
          description: msg,
        });
        toast.add({
          title: "Promotion failed",
          description: msg,
          data: { variant: "error" },
        });
      } finally {
        setPromotingId(null);
      }
    },
    [onModelsUpdated, promotingId, toast],
  );

  async function handleRunBenchmark() {
    if (isBenchmarking) return;
    setIsBenchmarking(true);
    setFeedback(null);
    try {
      const res = await curavexApi.runBenchmarkSuite();
      setBenchmarks(res.benchmark_suite);
      toast.add({
        title: "Benchmark suite completed",
        description: `Evaluated ${Object.keys(res.benchmark_suite).length} regressor architectures.`,
        data: { variant: "success" },
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not execute live benchmark suite.";
      setFeedback({
        variant: "error",
        title: "Benchmark failed",
        description: msg,
      });
    } finally {
      setIsBenchmarking(false);
    }
  }

  async function handleRetrainSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isTraining) return;
    setIsTraining(true);
    setFeedback(null);

    try {
      await curavexApi.trainModel(retrainAlgo, retrainVersion);
      setIsRetrainOpen(false);
      await onModelsUpdated();
      const msg = `Registered ${retrainAlgo.replace(/_/g, " ")} ${retrainVersion}.`;
      setFeedback({
        variant: "success",
        title: "Candidate model trained",
        description: msg,
      });
      toast.add({
        title: "Candidate model trained",
        description: msg,
        data: { variant: "success" },
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not start training job.";
      setFeedback({
        variant: "error",
        title: "Training job failed",
        description: msg,
      });
    } finally {
      setIsTraining(false);
    }
  }

  const rows: ModelRow[] = React.useMemo(
    () =>
      models.map((m) => ({
        ...m,
        id: m.model_id,
        rmseValue: m.metrics?.rmse ?? 99,
      })),
    [models],
  );

  const columns: DataTableColumn<ModelRow>[] = React.useMemo(
    () => [
      {
        id: "model_id",
        header: "Model ID",
        accessorKey: "model_id",
        sortable: true,
        cell: ({ row: m }) => (
          <span className="font-mono text-[var(--cv-text-primary)]">
            {m.model_id}
          </span>
        ),
      },
      {
        id: "algorithm",
        header: "Architecture",
        accessorKey: "algorithm",
        sortable: true,
        cell: ({ row: m }) => (
          <span className="capitalize text-[var(--cv-text-secondary)]">
            {m.algorithm.replace(/_/g, " ")}
          </span>
        ),
      },
      {
        id: "version",
        header: "Version",
        accessorKey: "version",
        sortable: true,
        cell: ({ row: m }) => (
          <span className="font-mono tabular-nums text-[var(--cv-text-primary)]">
            {m.version}
          </span>
        ),
      },
      {
        id: "status",
        header: "Stage",
        accessorKey: "status",
        sortable: true,
        cell: ({ row: m }) => (
          <Badge
            variant={
              m.status === "PRODUCTION"
                ? "success"
                : m.status === "STAGING"
                  ? "info"
                  : "neutral"
            }
            size="sm"
            dot={m.status === "PRODUCTION"}
          >
            {m.status}
          </Badge>
        ),
      },
      {
        id: "rmseValue",
        header: "RMSE",
        accessorKey: "rmseValue",
        sortable: true,
        cell: ({ row: m }) => (
          <span className="block text-end font-mono tabular-nums text-[var(--cv-text-secondary)]">
            {m.metrics?.rmse?.toFixed(4) ?? "N/A"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row: m }) =>
          m.status !== "PRODUCTION" ? (
            <Button
              variant="outline"
              size="sm"
              loading={promotingId === m.model_id}
              onClick={() => void handlePromote(m.model_id)}
            >
              Promote
            </Button>
          ) : (
            <span className="text-caption font-mono text-[var(--cv-text-secondary)]">
              Active
            </span>
          ),
      },
    ],
    [handlePromote, promotingId],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-title text-[var(--cv-text-primary)]">
                  {activeModel?.algorithm.replace(/_/g, " ") ??
                    "Gradient boosting"}
                </h2>
                <Badge variant="success" dot>
                  {activeModel?.version ?? "v2.0.0"} (Production)
                </Badge>
              </div>
              <p className="text-body text-[var(--cv-text-secondary)] max-w-[65ch]">
                Directing live clinical inference traffic. Evaluated against
                holdout validation on the trial dataset.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-2.5 text-end">
                <div className="text-caption text-[var(--cv-text-secondary)]">
                  Test RMSE
                </div>
                <div className="text-heading font-mono tabular-nums text-[var(--cv-text-primary)]">
                  {activeModel?.metrics?.rmse ?? "1.4602"}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-2.5 text-end">
                <div className="text-caption text-[var(--cv-text-secondary)]">
                  Test MAE
                </div>
                <div className="text-heading font-mono tabular-nums text-[var(--cv-text-primary)]">
                  {activeModel?.metrics?.mae ?? "1.1778"}
                </div>
              </div>

              {modelSwitcherOptions.length > 0 && (
                <ModelContextSwitcher
                  triggerLabel="Promote"
                  size="sm"
                  options={modelSwitcherOptions}
                  value={activeModel?.model_id}
                  onChange={(id) => {
                    if (id !== activeModel?.model_id) {
                      void handlePromote(id);
                    }
                  }}
                />
              )}

              <Button
                variant="outline"
                size="md"
                loading={isBenchmarking}
                leftIcon={<IconChartBar size={16} />}
                onClick={() => void handleRunBenchmark()}
                className="min-h-[44px]"
              >
                Run benchmark
              </Button>

              <Button
                variant="default"
                size="md"
                className="min-h-[44px]"
                onClick={() => setIsRetrainOpen(true)}
              >
                Retrain model
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.title}
          description={feedback.description}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {benchmarks && (
        <Card>
          <CardHeader>
            <CardTitle className="text-heading">
              Live regressor benchmark suite
            </CardTitle>
            <CardDescription>
              Holdout comparison across scikit-learn candidate architectures.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(benchmarks).map(([algo, report]) => (
              <div
                key={algo}
                className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 space-y-2"
              >
                <div className="text-label capitalize text-[var(--cv-text-primary)]">
                  {algo.replace(/_/g, " ")}
                </div>
                <div className="space-y-1 font-mono text-caption tabular-nums text-[var(--cv-text-secondary)]">
                  <div>
                    RMSE:{" "}
                    <span className="text-[var(--cv-text-primary)]">
                      {report.test_metrics.rmse.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    MAE:{" "}
                    <span className="text-[var(--cv-text-primary)]">
                      {report.test_metrics.mae.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    Pearson r:{" "}
                    <span className="text-[var(--cv-text-primary)]">
                      {report.test_metrics.pearson_corr.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-heading">Manage registered models</CardTitle>
          <CardDescription>
            Compare candidate architectures, validation metrics, and promote a
            model to production.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Separator />
          {rows.length > 0 ? (
            <DataTable<ModelRow>
              columns={columns}
              data={rows}
              sortable
              filterable
              density="comfortable"
            />
          ) : (
            <EmptyState
              icon={
                <IconCpu
                  size={28}
                  stroke={1.6}
                  className="text-[var(--cv-text-secondary)]"
                />
              }
              title="No models loaded"
              description="Registered candidate models will appear here once the registry responds."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isRetrainOpen} onOpenChange={setIsRetrainOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Retrain clinical model</DialogTitle>
            <DialogDescription>
              Train a new scikit-learn candidate on the canonical dataset and
              register it in STAGING.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRetrainSubmit} className="space-y-4 pt-2">
            <NativeSelect
              id="retrain-algo"
              label="Architecture"
              value={retrainAlgo}
              onChange={(e) => setRetrainAlgo(e.target.value)}
              options={[
                {
                  value: "gradient_boosting",
                  label: "Gradient Boosting Regressor",
                },
                { value: "random_forest", label: "Random Forest Regressor" },
                {
                  value: "ridge",
                  label: "Ridge Regression (L2 Regularized)",
                },
                {
                  value: "decision_tree",
                  label: "Decision Tree Regressor",
                },
              ]}
            />

            <Input
              id="retrain-version"
              type="text"
              label="Release version"
              value={retrainVersion}
              onChange={(e) => setRetrainVersion(e.target.value)}
              required
              inputClassName="font-mono"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRetrainOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" loading={isTraining}>
                {isTraining ? "Training model…" : "Launch retraining job"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
