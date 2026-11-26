"use client";

import * as React from "react";
import { IconCpu, IconX } from "@tabler/icons-react";
import { Alert } from "@/components/wensity/alert";
import { Button } from "@/components/wensity/button";
import { EmptyState } from "@/components/wensity/empty-state";
import { Field, FieldControl } from "@/components/wensity/field";
import {
  ModelContextSwitcher,
  type ModelOption,
} from "@/components/wensity/model-context-switcher";
import { NativeSelect } from "@/components/wensity/native-select";
import { Separator } from "@/components/wensity/separator";
import { curavexApi, type RegisteredModel } from "@/lib/api";

export function MlopsTab({
  models,
  activeModel,
  onModelsUpdated,
}: {
  models: RegisteredModel[];
  activeModel: RegisteredModel | null;
  onModelsUpdated: () => Promise<void>;
}) {
  const [promotingId, setPromotingId] = React.useState<string | null>(null);
  const [isRetrainOpen, setIsRetrainOpen] = React.useState(false);
  const [retrainAlgo, setRetrainAlgo] = React.useState("gradient_boosting");
  const [retrainVersion, setRetrainVersion] = React.useState("v2.1.0");
  const [isTraining, setIsTraining] = React.useState(false);
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

  async function handlePromote(modelId: string) {
    if (promotingId) return;
    setPromotingId(modelId);
    setFeedback(null);

    try {
      await curavexApi.promoteModel(modelId);
      await onModelsUpdated();
      setFeedback({
        variant: "success",
        title: "Model promoted",
        description: `${modelId} is now serving production clinical traffic.`,
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "Promotion failed",
        description:
          err instanceof Error ? err.message : "Could not promote model.",
      });
    } finally {
      setPromotingId(null);
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
      setFeedback({
        variant: "success",
        title: "Candidate model trained",
        description: `Registered ${retrainAlgo.replace(/_/g, " ")} ${retrainVersion}.`,
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "Training job failed",
        description:
          err instanceof Error ? err.message : "Could not start training job.",
      });
    } finally {
      setIsTraining(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-title text-[var(--cv-text-primary)] capitalize">
                {activeModel?.algorithm.replace(/_/g, " ") ??
                  "Gradient Boosting"}
              </h1>
              <span className="rounded border border-[var(--cv-border-strong)] bg-[var(--cv-surface-raised)] px-2.5 py-0.5 text-caption font-mono text-[var(--cv-text-primary)]">
                {activeModel?.version ?? "v1.0.0"} · Production
              </span>
            </div>
            <p className="text-body text-[var(--cv-text-secondary)] max-w-[65ch]">
              Directing live clinical inference traffic. Evaluated against
              5-fold cross-validation on the canonical cohort.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-md border border-[var(--cv-border)] bg-[var(--cv-surface-raised)] px-4 py-2.5 text-end">
              <div className="text-caption text-[var(--cv-text-secondary)]">
                Test RMSE
              </div>
              <div className="text-heading font-mono tabular-nums text-[var(--cv-text-primary)]">
                {activeModel?.metrics?.rmse ?? "1.45"}
              </div>
            </div>
            <div className="rounded-md border border-[var(--cv-border)] bg-[var(--cv-surface-raised)] px-4 py-2.5 text-end">
              <div className="text-caption text-[var(--cv-text-secondary)]">
                Test MAE
              </div>
              <div className="text-heading font-mono tabular-nums text-[var(--cv-text-primary)]">
                {activeModel?.metrics?.mae ?? "1.18"}
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
              variant="default"
              size="md"
              className="min-h-[44px]"
              onClick={() => setIsRetrainOpen(true)}
            >
              Retrain model
            </Button>
          </div>
        </div>
      </section>

      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.title}
          description={feedback.description}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <section className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-heading text-[var(--cv-text-primary)]">
            Manage registered models
          </h2>
          <p className="text-body text-[var(--cv-text-secondary)]">
            Compare candidate architectures, validation metrics, and promote a
            model to production.
          </p>
        </div>

        <Separator />

        {models.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-[var(--cv-border)] text-label text-[var(--cv-text-secondary)]">
                  <th className="py-3 px-3 text-start">Model ID</th>
                  <th className="py-3 px-3 text-start">Architecture</th>
                  <th className="py-3 px-3 text-start">Version</th>
                  <th className="py-3 px-3 text-start">Stage</th>
                  <th className="py-3 px-3 text-end">RMSE</th>
                  <th className="py-3 px-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr
                    key={m.model_id}
                    className="border-b border-[var(--cv-border)]/60 hover:bg-white/[0.02] text-body"
                  >
                    <td className="py-3 px-3 font-mono text-[var(--cv-text-primary)]">
                      {m.model_id}
                    </td>
                    <td className="py-3 px-3 capitalize text-[var(--cv-text-secondary)]">
                      {m.algorithm.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-[var(--cv-text-primary)]">
                      {m.version}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex rounded border border-[var(--cv-border-strong)] bg-[var(--cv-surface-raised)] px-2 py-0.5 text-caption font-mono text-[var(--cv-text-primary)]">
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-end font-mono tabular-nums text-[var(--cv-text-secondary)]">
                      {m.metrics?.rmse ?? "N/A"}
                    </td>
                    <td className="py-3 px-3 text-end">
                      {m.status !== "PRODUCTION" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={promotingId === m.model_id}
                          onClick={() => void handlePromote(m.model_id)}
                        >
                          Promote to production
                        </Button>
                      ) : (
                        <span className="text-caption font-mono text-[var(--cv-text-secondary)]">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      </section>

      {isRetrainOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="retrain-dialog-title"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2
                id="retrain-dialog-title"
                className="text-heading text-[var(--cv-text-primary)]"
              >
                Retrain clinical model
              </h2>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setIsRetrainOpen(false)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)]"
              >
                <IconX size={18} />
              </button>
            </div>

            <form onSubmit={handleRetrainSubmit} className="space-y-4">
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

              <Field label="Release version" required>
                <FieldControl asChild>
                  <input
                    id="retrain-version"
                    type="text"
                    value={retrainVersion}
                    onChange={(e) => setRetrainVersion(e.target.value)}
                    required
                    className="w-full min-h-[42px] rounded-md border border-[var(--cv-border)] bg-[#08090b] px-3 py-2 text-base sm:text-sm font-mono text-[var(--cv-text-primary)] focus:border-[var(--cv-text-primary)] focus:outline-none"
                  />
                </FieldControl>
              </Field>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsRetrainOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  loading={isTraining}
                >
                  {isTraining ? "Training model…" : "Launch retraining job"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
