"use client";

import * as React from "react";
import {
  IconActivityHeartbeat,
  IconInfoCircle,
  IconLock,
} from "@tabler/icons-react";
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
import { EmptyState } from "@/components/wensity/empty-state";
import { Input } from "@/components/wensity/input";
import { NativeSelect } from "@/components/wensity/native-select";
import { Progress } from "@/components/wensity/progress";
import { RadioGroup, RadioOption } from "@/components/wensity/radio-group";
import { Separator } from "@/components/wensity/separator";
import {
  ShimmeringSkeletonWrapper,
  SkeletonLine,
} from "@/components/wensity/shimmering-skeleton-wrapper";
import { Slider } from "@/components/wensity/slider";
import { useToastManager } from "@/components/wensity/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/wensity/tooltip";
import { FeatureAttributionChart } from "@/components/charts/ClinicalCharts";
import { BatchTab } from "@/components/workspace/BatchTab";
import { RadioGroup as ModeGroup, RadioOption as ModeOption } from "@/components/wensity/radio-group";
import {
  ApiError,
  curavexApi,
  type BillingStatus,
  type ClinicalMetadata,
  type PredictionResponse,
} from "@/lib/api";
import {
  CANONICAL_CONDITION_DRUG_MAP,
  CLINICAL_LIMITS,
  CLINICAL_PRESETS,
  formatConfidenceInterval,
  validateClinicalInput,
  type ClinicalCasePreset,
} from "@/lib/clinical-validation";

export type ScoringMode = "single" | "batch";

export function PredictTab({
  clinicalMeta,
  selectedPreset,
  billingStatus,
  mode = "single",
  onModeChange,
  onPredictionComplete,
}: {
  clinicalMeta: ClinicalMetadata | null;
  selectedPreset?: { preset: ClinicalCasePreset; nonce: number } | null;
  billingStatus?: BillingStatus | null;
  mode?: ScoringMode;
  onModeChange?: (mode: ScoringMode) => void;
  onPredictionComplete: () => void;
}) {
  const [internalMode, setInternalMode] = React.useState<ScoringMode>(mode);
  const activeMode = onModeChange ? mode : internalMode;
  const setMode = onModeChange ?? setInternalMode;
  const toast = useToastManager();
  const conditionDrugMap =
    clinicalMeta?.condition_drug_mapping ?? CANONICAL_CONDITION_DRUG_MAP;
  const conditions = clinicalMeta?.conditions?.length
    ? clinicalMeta.conditions
    : Object.keys(conditionDrugMap).sort();

  const [age, setAge] = React.useState(48);
  const [gender, setGender] = React.useState<"Female" | "Male">("Female");
  const [condition, setCondition] = React.useState(conditions[0] ?? "Hypertension");
  const drugsForCondition = React.useMemo(
    () => conditionDrugMap[condition] ?? ["Amlodipine"],
    [conditionDrugMap, condition],
  );
  const [drugName, setDrugName] = React.useState(drugsForCondition[0] ?? "Amlodipine");
  const [dosage, setDosage] = React.useState(250);
  const [duration, setDuration] = React.useState(30);

  const [isPredicting, setIsPredicting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PredictionResponse | null>(null);
  const [quotaNotice, setQuotaNotice] = React.useState<string | null>(null);

  const quotaExhausted = Boolean(
    billingStatus && billingStatus.limit !== null && billingStatus.remaining === 0,
  );

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

  React.useEffect(() => {
    if (!selectedPreset) return;
    const { input } = selectedPreset.preset;
    setAge(input.Age);
    setGender(input.Gender === "Male" ? "Male" : "Female");
    setCondition(input.Condition);
    setDrugName(input.Drug_Name);
    setDosage(input.Dosage_mg);
    setDuration(input.Treatment_Duration_days);
    setErrorMsg(null);
  }, [selectedPreset]);

  function applyPreset(preset: ClinicalCasePreset) {
    setAge(preset.input.Age);
    setGender(preset.input.Gender === "Male" ? "Male" : "Female");
    setCondition(preset.input.Condition);
    setDrugName(preset.input.Drug_Name);
    setDosage(preset.input.Dosage_mg);
    setDuration(preset.input.Treatment_Duration_days);
    setErrorMsg(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPredicting) return;

    const payload = {
      Age: age,
      Gender: gender,
      Condition: condition,
      Drug_Name: drugName,
      Dosage_mg: dosage,
      Treatment_Duration_days: duration,
    };

    const validationError = validateClinicalInput(payload, conditionDrugMap);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsPredicting(true);
    setErrorMsg(null);
    setQuotaNotice(null);

    try {
      const response = await curavexApi.predictSingle(payload);
      setResult(response);
      onPredictionComplete();
      toast.add({
        title: "Patient scored",
        description: `${response.predicted_score.toFixed(2)} / 10.0 (${response.effectiveness_level} efficacy)`,
        data: { variant: "success" },
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "We couldn't reach the scoring engine. Check your connection and try again.";
      if (err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
        setQuotaNotice(message);
        onPredictionComplete();
      } else {
        setErrorMsg(message);
        toast.add({
          title: "Scoring failed",
          description: message,
          data: { variant: "error" },
        });
      }
    } finally {
      setIsPredicting(false);
    }
  }

  const efficacyBadgeVariant =
    result?.effectiveness_level === "High"
      ? "success"
      : result?.effectiveness_level === "Medium"
        ? "info"
        : "warning";

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-title text-[var(--cv-text-primary)]">
              Clinical scoring
            </h2>
            <p className="text-body text-[var(--cv-text-secondary)]">
              Evaluate an individual patient regimen or score a multi-patient CSV cohort.
              {billingStatus && billingStatus.limit !== null && (
                <>
                  {" "}
                  <span className="font-medium text-[var(--cv-text-primary)] tabular-nums">
                    {billingStatus.remaining} of {billingStatus.limit} free requests remaining this month.
                  </span>{" "}
                  <a href="/#pricing" className="text-[var(--cv-text-primary)]">
                    View plans
                  </a>
                </>
              )}
            </p>
          </div>
          <ModeGroup
            aria-label="Scoring mode"
            variant="segment"
            orientation="horizontal"
            value={activeMode}
            onValueChange={(val) => setMode(val === "batch" ? "batch" : "single")}
            className="shrink-0"
          >
            <ModeOption value="single" label="Single patient" />
            <ModeOption value="batch" label="Batch cohort (CSV)" />
          </ModeGroup>
        </div>

        {activeMode === "batch" ? (
          <BatchTab />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-7 min-w-0">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-title">Score a patient regimen</CardTitle>
              <Badge variant="outline" size="sm">
                Calibrated regression
              </Badge>
            </div>
            <CardDescription className="max-w-[60ch]">
              Configure patient demographics and compound dosing to estimate
              clinical improvement and local feature attribution.
            </CardDescription>

            <div className="flex flex-wrap gap-2 pt-1">
              {CLINICAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3.5 py-1.5 text-caption text-[var(--cv-text-secondary)] hover:border-[var(--cv-accent)] hover:text-[var(--cv-text-primary)] transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                  <Input
                    id="input-age"
                    type="number"
                    label="Patient age (years)"
                    hint={`Trial cohort: ${CLINICAL_LIMITS.Age.cohortMin}–${CLINICAL_LIMITS.Age.cohortMax} years`}
                    min={CLINICAL_LIMITS.Age.min}
                    max={CLINICAL_LIMITS.Age.max}
                    value={String(age)}
                    onChange={(e) => {
                      const next = parseInt(e.target.value, 10);
                      if (!Number.isNaN(next)) setAge(next);
                    }}
                    required
                    inputClassName="font-mono tabular-nums text-base sm:text-sm"
                  />
                  <Slider
                    label="Adjust patient age"
                    showValue={false}
                    min={CLINICAL_LIMITS.Age.min}
                    max={CLINICAL_LIMITS.Age.max}
                    step={1}
                    value={Math.min(Math.max(age, CLINICAL_LIMITS.Age.min), CLINICAL_LIMITS.Age.max)}
                    onValueChange={(v) => setAge(v)}
                  />
                </div>

                <RadioGroup
                  label="Biological sex"
                  description="Demographic stratum"
                  variant="segment"
                  orientation="horizontal"
                  value={gender}
                  onValueChange={(val) =>
                    setGender(val === "Male" ? "Male" : "Female")
                  }
                >
                  <RadioOption value="Female" label="Female" />
                  <RadioOption value="Male" label="Male" />
                </RadioGroup>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Input
                    id="input-dosage"
                    type="number"
                    label="Unit dose (mg)"
                    hint={`Trial cohort: ${CLINICAL_LIMITS.Dosage_mg.cohortMin}–${CLINICAL_LIMITS.Dosage_mg.cohortMax} mg`}
                    step={10}
                    min={CLINICAL_LIMITS.Dosage_mg.min}
                    max={CLINICAL_LIMITS.Dosage_mg.max}
                    value={String(dosage)}
                    onChange={(e) => {
                      const next = parseFloat(e.target.value);
                      if (!Number.isNaN(next)) setDosage(next);
                    }}
                    required
                    inputClassName="font-mono tabular-nums text-base sm:text-sm"
                  />
                  <Slider
                    label="Adjust unit dose"
                    showValue={false}
                    min={CLINICAL_LIMITS.Dosage_mg.min}
                    max={1000}
                    step={10}
                    value={Math.min(Math.max(dosage, CLINICAL_LIMITS.Dosage_mg.min), 1000)}
                    onValueChange={(v) => setDosage(v)}
                    formatValue={(v) => `${v} mg`}
                  />
                </div>

                <div className="space-y-3">
                  <Input
                    id="input-duration"
                    type="number"
                    label="Treatment duration (days)"
                    hint={`Trial cohort: ${CLINICAL_LIMITS.Treatment_Duration_days.cohortMin}–${CLINICAL_LIMITS.Treatment_Duration_days.cohortMax} days`}
                    min={CLINICAL_LIMITS.Treatment_Duration_days.min}
                    max={CLINICAL_LIMITS.Treatment_Duration_days.max}
                    value={String(duration)}
                    onChange={(e) => {
                      const next = parseInt(e.target.value, 10);
                      if (!Number.isNaN(next)) setDuration(next);
                    }}
                    required
                    inputClassName="font-mono tabular-nums text-base sm:text-sm"
                  />
                  <Slider
                    label="Adjust treatment duration"
                    showValue={false}
                    min={CLINICAL_LIMITS.Treatment_Duration_days.min}
                    max={120}
                    step={1}
                    value={Math.min(
                      Math.max(duration, CLINICAL_LIMITS.Treatment_Duration_days.min),
                      120,
                    )}
                    onValueChange={(v) => setDuration(v)}
                    formatValue={(v) => `${v} d`}
                  />
                </div>
              </div>

              {errorMsg && (
                <Alert
                  variant="error"
                  title="Scoring failed"
                  description={errorMsg}
                  onDismiss={() => setErrorMsg(null)}
                />
              )}

              <Button
                type="submit"
                variant="default"
                size="lg"
                loading={isPredicting}
                className="w-full min-h-[44px]"
              >
                {isPredicting ? "Scoring patient…" : "Score patient"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <aside className="lg:col-span-5 min-w-0 space-y-6">
          <ShimmeringSkeletonWrapper loading={isPredicting} rounded="rounded-2xl">
            <Card>
              <CardContent className="p-6">
                {isPredicting ? (
                  <div className="space-y-4">
                    <SkeletonLine width="42%" />
                    <SkeletonLine width="65%" />
                    <SkeletonLine width="100%" />
                    <SkeletonLine width="85%" />
                  </div>
                ) : quotaNotice || (quotaExhausted && !result) ? (
                  <EmptyState
                    icon={
                      <IconLock
                        size={28}
                        stroke={1.6}
                        className="text-[var(--cv-text-secondary)]"
                      />
                    }
                    title="Monthly requests used"
                    description={
                      quotaNotice ??
                      "You've used all free scoring requests for this month. Upgrade your plan to keep scoring patients."
                    }
                    action={
                      <Button asChild variant="outline" size="md" className="min-h-[44px]">
                        <a href="/#pricing">View plans</a>
                      </Button>
                    }
                    className="py-8"
                  />
                ) : result ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-heading text-[var(--cv-text-primary)]">
                        Prognosis output
                      </h2>
                      <Badge variant={efficacyBadgeVariant} dot>
                        {result.effectiveness_level} efficacy
                      </Badge>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="text-caption text-[var(--cv-text-secondary)]">
                        Expected improvement score
                      </div>
                      <div className="flex items-baseline gap-2 tabular-nums">
                        <span className="text-display text-[var(--cv-text-primary)]">
                          {result.predicted_score.toFixed(2)}
                        </span>
                        <span className="text-body text-[var(--cv-text-secondary)]">
                          / 10.0
                        </span>
                      </div>

                      <Progress
                        value={result.predicted_score}
                        max={10}
                        size="md"
                        tone={
                          result.effectiveness_level === "High"
                            ? "success"
                            : result.effectiveness_level === "Medium"
                              ? "brand"
                              : "warning"
                        }
                        label="Improvement score"
                      />

                      <div className="flex items-center gap-1.5 text-caption text-[var(--cv-text-secondary)]">
                        <span>95% confidence interval:</span>
                        <code className="font-mono text-[var(--cv-text-primary)] slashed-zero">
                          {formatConfidenceInterval(result.confidence_interval)}
                        </code>
                        <Tooltip>
                          <TooltipTrigger
                            type="button"
                            aria-label="Confidence interval explanation"
                            className="inline-flex text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)]"
                          >
                            <IconInfoCircle size={15} />
                          </TooltipTrigger>
                          <TooltipContent>
                            Derived from active model holdout RMSE (±1.96 × RMSE,
                            clamped to [0.0, 10.0]).
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {result.feature_attributions &&
                      result.feature_attributions.length > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-3">
                            <h3 className="text-label text-[var(--cv-text-primary)]">
                              Local feature attribution
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
                    description="Submit patient parameters or choose a clinical preset to compute an improvement score and feature attribution."
                    className="py-8"
                  />
                )}
              </CardContent>
            </Card>
          </ShimmeringSkeletonWrapper>

          <Alert
            variant="neutral"
            title="Clinical calibration notice"
            description="Predictions reflect historical trial-cohort patterns (Low 1.0–4.5, Medium 4.6–7.5, High 7.6–10.0). Review confidence bounds alongside clinical judgment."
          />
        </aside>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
