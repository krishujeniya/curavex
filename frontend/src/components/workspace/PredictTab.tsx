"use client";

import * as React from "react";
import { IconActivityHeartbeat } from "@tabler/icons-react";
import { Alert } from "@/components/wensity/alert";
import { Button } from "@/components/wensity/button";
import { EmptyState } from "@/components/wensity/empty-state";
import { Field, FieldControl } from "@/components/wensity/field";
import { NativeSelect } from "@/components/wensity/native-select";
import { Separator } from "@/components/wensity/separator";
import {
  ShimmeringSkeletonWrapper,
  SkeletonLine,
} from "@/components/wensity/shimmering-skeleton-wrapper";
import { FeatureAttributionChart } from "@/components/charts/ClinicalCharts";
import {
  curavexApi,
  type ClinicalMetadata,
  type PredictionResponse,
} from "@/lib/api";

const FALLBACK_CONDITIONS = [
  "Hypertension",
  "Depression",
  "Diabetes",
  "Infection",
  "Pain Relief",
];

const inputClassName =
  "w-full min-h-[42px] rounded-md border border-[var(--cv-border)] bg-[#08090b] px-3 py-2 text-base sm:text-sm text-[var(--cv-text-primary)] font-mono tabular-nums placeholder:text-[var(--cv-text-disabled)] hover:border-[var(--cv-border-strong)] focus:border-[var(--cv-text-primary)] focus:outline-none";

export function PredictTab({
  clinicalMeta,
  onPredictionComplete,
}: {
  clinicalMeta: ClinicalMetadata | null;
  onPredictionComplete: () => void;
}) {
  const conditions = clinicalMeta?.conditions?.length
    ? clinicalMeta.conditions
    : FALLBACK_CONDITIONS;

  const [age, setAge] = React.useState("48");
  const [gender, setGender] = React.useState("Female");
  const [condition, setCondition] = React.useState(conditions[0]);
  const drugsForCondition = React.useMemo(
    () => clinicalMeta?.condition_drug_mapping?.[condition] ?? ["Amlodipine"],
    [clinicalMeta, condition],
  );
  const [drugName, setDrugName] = React.useState(drugsForCondition[0] ?? "");
  const [dosage, setDosage] = React.useState("250");
  const [duration, setDuration] = React.useState("30");

  const [isPredicting, setIsPredicting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PredictionResponse | null>(null);

  React.useEffect(() => {
    if (!conditions.includes(condition)) {
      setCondition(conditions[0]);
    }
  }, [conditions, condition]);

  React.useEffect(() => {
    if (drugsForCondition.length && !drugsForCondition.includes(drugName)) {
      setDrugName(drugsForCondition[0]);
    }
  }, [drugsForCondition, drugName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPredicting) return;

    setIsPredicting(true);
    setErrorMsg(null);

    try {
      const response = await curavexApi.predictSingle({
        Age: parseInt(age, 10),
        Gender: gender,
        Condition: condition,
        Drug_Name: drugName,
        Dosage_mg: parseFloat(dosage),
        Treatment_Duration_days: parseInt(duration, 10),
      });
      setResult(response);
      onPredictionComplete();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "We couldn't reach the scoring engine. Check your connection and try again.",
      );
    } finally {
      setIsPredicting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <section className="lg:col-span-7 min-w-0 rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6">
        <div className="mb-6 space-y-2">
          <h1 className="text-title text-[var(--cv-text-primary)]">
            Score a patient regimen
          </h1>
          <p className="text-body text-[var(--cv-text-secondary)] max-w-[60ch]">
            Enter patient demographics and compound dosing to estimate expected
            clinical improvement and feature attribution.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Patient age" description="Trial cohort: 18 to 79 years" required>
              <FieldControl asChild>
                <input
                  id="input-age"
                  type="number"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  className={inputClassName}
                />
              </FieldControl>
            </Field>

            <NativeSelect
              id="input-gender"
              label="Biological sex"
              hint="Demographic strata"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={[
                { value: "Female", label: "Female" },
                { value: "Male", label: "Male" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NativeSelect
              id="input-condition"
              label="Primary indication"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              options={conditions.map((c) => ({ value: c, label: c }))}
            />

            <NativeSelect
              id="input-drug"
              label="Approved compound"
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              options={drugsForCondition.map((d) => ({ value: d, label: d }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Unit dose (mg)" description="Permitted range: 50 to 850 mg" required>
              <FieldControl asChild>
                <input
                  id="input-dosage"
                  type="number"
                  step={10}
                  min={20}
                  max={1500}
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  required
                  className={inputClassName}
                />
              </FieldControl>
            </Field>

            <Field label="Duration (days)" description="Course length: 5 to 60 days" required>
              <FieldControl asChild>
                <input
                  id="input-duration"
                  type="number"
                  min={1}
                  max={365}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  className={inputClassName}
                />
              </FieldControl>
            </Field>
          </div>

          {errorMsg && (
            <Alert
              variant="error"
              title="Prognosis request failed"
              description={errorMsg}
              onDismiss={() => setErrorMsg(null)}
            />
          )}

          <div className="pt-2">
            <Button
              type="submit"
              variant="default"
              size="lg"
              loading={isPredicting}
              className="w-full min-h-[44px]"
            >
              {isPredicting ? "Evaluating prognosis…" : "Score patient"}
            </Button>
          </div>
        </form>
      </section>

      <aside className="lg:col-span-5 min-w-0 space-y-6">
        <ShimmeringSkeletonWrapper loading={isPredicting} rounded="rounded-lg">
          <div className="rounded-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-6">
            {isPredicting ? (
              <div className="space-y-4">
                <SkeletonLine width="42%" />
                <SkeletonLine width="65%" />
                <SkeletonLine width="100%" />
                <SkeletonLine width="85%" />
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-heading text-[var(--cv-text-primary)]">
                    Prognosis output
                  </h2>
                  <span className="inline-flex items-center rounded border border-[var(--cv-border-strong)] bg-[var(--cv-surface-raised)] px-2.5 py-1 text-caption font-mono font-medium text-[var(--cv-text-primary)]">
                    {result.effectiveness_level} efficacy
                  </span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="text-caption text-[var(--cv-text-secondary)]">
                    Expected improvement score
                  </div>
                  <div className="flex items-baseline gap-2 font-mono tabular-nums">
                    <span className="text-display text-[var(--cv-text-primary)]">
                      {result.predicted_score.toFixed(2)}
                    </span>
                    <span className="text-body text-[var(--cv-text-secondary)]">
                      / 10.0
                    </span>
                  </div>
                  <p className="text-caption text-[var(--cv-text-secondary)]">
                    95% confidence interval:{" "}
                    <code className="font-mono text-[var(--cv-text-primary)] slashed-zero">
                      [{result.confidence_interval[0]} –{" "}
                      {result.confidence_interval[1]}]
                    </code>
                  </p>
                </div>

                {result.feature_attributions &&
                  result.feature_attributions.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-label text-[var(--cv-text-primary)]">
                          Feature impact attribution
                        </h3>
                        <FeatureAttributionChart
                          items={result.feature_attributions}
                        />
                      </div>
                    </>
                  )}

                <Separator />

                <div className="flex items-center justify-between gap-4 text-caption font-mono text-[var(--cv-text-secondary)] tabular-nums">
                  <span>Inference: {result.latency_ms.toFixed(1)} ms</span>
                  <span className="truncate max-w-[200px]">
                    {result.model_id}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={
                  <IconActivityHeartbeat
                    size={28}
                    stroke={1.6}
                    className="text-[var(--cv-text-secondary)]"
                  />
                }
                title="No prognosis run yet"
                description="Submit patient regimen parameters on the left to compute an improvement score and feature attribution."
                className="py-8"
              />
            )}
          </div>
        </ShimmeringSkeletonWrapper>

        <Alert
          variant="neutral"
          title="Biostatistical thresholds"
          description="Ensemble regression trained on multi-cohort clinical trial trajectories. Tiers: Low (1.0 to 4.5), Medium (4.6 to 7.5), High (7.6 to 10.0)."
        />
      </aside>
    </div>
  );
}
