"use client";

import * as React from "react";
import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import { Badge } from "@/components/wensity/badge";
import { Button } from "@/components/wensity/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/wensity/card";
import { NumberTicker } from "@/components/wensity/count-up-animation";
import { Marker } from "@/components/wensity/marker";
import { Separator } from "@/components/wensity/separator";
import { TextBlurReveal } from "@/components/wensity/text-blur-reveal";
import { TextScramble } from "@/components/wensity/text-scramble";
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

export function HeroSection({
  activeModel,
  telemetry,
  drift,
  datasetStats,
  apiStatus,
  onStartScoring,
  onSelectPreset,
}: HeroSectionProps) {
  const sectionRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    const handlePointerMove = (e: PointerEvent) => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
        const y = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
        el.style.setProperty("--mx", `${x}%`);
        el.style.setProperty("--my", `${y}%`);
        rafId = 0;
      });
    };

    el.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      el.removeEventListener("pointermove", handlePointerMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const totalRecords = datasetStats?.total_records ?? 1000;
  const conditionCount = datasetStats?.condition_distribution
    ? Object.keys(datasetStats.condition_distribution).length
    : 5;
  const rmseValue = activeModel?.metrics?.rmse ?? 1.4602;
  const p50Latency = telemetry?.latency_ms?.p50 ?? 0;

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative overflow-hidden border-b border-[var(--cv-border)]"
      style={{ background: "var(--cv-grad-hero)" }}
    >
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 min-w-0 space-y-6">
            <TextBlurReveal
              as="h1"
              text="Predict clinical response with measurable drift control."
              animateBy="words"
              direction="top"
              delay={60}
              stepDuration={0.32}
              startOnView={false}
              className="font-[family-name:var(--font-display)] text-display text-[var(--cv-text-primary)] max-w-[18ch]"
            />

            <p className="text-body text-[var(--cv-text-secondary)] max-w-[60ch]">
              Curavex scores patient improvement trajectories from demographics and
              compound dosing, evaluates CSV cohorts in batches, and tracks
              Kolmogorov-Smirnov and PSI drift in production.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                variant="default"
                size="lg"
                rightIcon={<IconArrowDownRight size={17} />}
                rightIconMotion="arrow"
                onClick={onStartScoring}
                className="min-h-[44px]"
              >
                Score a patient
              </Button>
              <Button variant="outline" size="lg" asChild className="min-h-[44px]">
                <a href="#architecture">
                  <span>Inspect architecture</span>
                  <IconArrowUpRight size={16} />
                </a>
              </Button>
            </div>

            <div className="pt-2 space-y-2.5">
              <div className="text-caption text-[var(--cv-text-secondary)]">
                Load a verified clinical preset:
              </div>
              <div className="flex flex-wrap gap-2">
                {CLINICAL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset)}
                    className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3.5 py-1.5 text-caption text-[var(--cv-text-primary)] hover:border-[var(--cv-accent)] transition-colors cursor-pointer"
                  >
                    <span className="font-medium">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 min-w-0">
            <Card
              className="border-[var(--cv-border)] shadow-[var(--cv-shadow-elev)]"
              style={{ background: "var(--cv-grad-card)" }}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-heading">System snapshot</CardTitle>
                  <Marker
                    variant="status"
                    tone={
                      apiStatus === "live"
                        ? "success"
                        : apiStatus === "connecting"
                          ? "info"
                          : "warning"
                    }
                    label={
                      apiStatus === "live"
                        ? "Live API"
                        : apiStatus === "connecting"
                          ? "Connecting"
                          : "Reference mode"
                    }
                  />
                </div>
                <CardDescription>
                  Active production pipeline and statistical baseline from the
                  canonical pharmacology cohort.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 space-y-1.5">
                  <div className="text-caption text-[var(--cv-text-secondary)]">
                    Serving model
                  </div>
                  <div className="font-mono text-label text-[var(--cv-text-primary)] truncate">
                    <TextScramble
                      text={
                        activeModel?.model_id ??
                        "gradient_boosting-v2.0.0-c31272"
                      }
                      trigger="mount"
                      duration={0.6}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 space-y-1">
                    <div className="text-caption text-[var(--cv-text-secondary)]">
                      Trial cohort
                    </div>
                    <div className="font-[family-name:var(--font-display)] text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
                      <NumberTicker value={totalRecords} trigger="mount" />
                    </div>
                    <div className="text-caption text-[var(--cv-text-secondary)]">
                      {conditionCount} indications · 15 drugs
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 space-y-1">
                    <div className="text-caption text-[var(--cv-text-secondary)]">
                      Validation RMSE
                    </div>
                    <div className="font-[family-name:var(--font-display)] text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
                      {rmseValue.toFixed(4)}
                    </div>
                    <div className="text-caption text-[var(--cv-text-secondary)]">
                      95% CI calibrated
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-3 text-caption">
                  <div className="flex items-center gap-2 font-mono tabular-nums text-[var(--cv-text-secondary)]">
                    <span>p50 latency:</span>
                    <span className="text-[var(--cv-text-primary)] font-medium">
                      {p50Latency.toFixed(1)} ms
                    </span>
                  </div>
                  <Badge
                    variant={
                      drift?.overall_drift_detected ? "warning" : "success"
                    }
                    dot
                  >
                    {drift
                      ? drift.overall_drift_detected
                        ? `${drift.drifted_features_count ?? 1} drifted feature`
                        : "Distribution stable"
                      : "KS p < 0.05 guard"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--cv-border)] bg-[var(--cv-surface)]/70">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[var(--cv-border)] px-4 sm:px-6 lg:px-8">
          <div className="py-6 pe-4 space-y-1">
            <div className="font-[family-name:var(--font-display)] text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
              <NumberTicker value={totalRecords} />
            </div>
            <div className="text-caption text-[var(--cv-text-secondary)]">
              Canonical clinical records, 0 missing values
            </div>
          </div>
          <div className="py-6 ps-4 lg:px-6 space-y-1">
            <div className="font-[family-name:var(--font-display)] text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
              6
            </div>
            <div className="text-caption text-[var(--cv-text-secondary)]">
              Validated demographic &amp; dosing inputs
            </div>
          </div>
          <div className="py-6 pe-4 lg:px-6 space-y-1">
            <div className="font-[family-name:var(--font-display)] text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
              4
            </div>
            <div className="text-caption text-[var(--cv-text-secondary)]">
              Benchmarked scikit-learn regressors
            </div>
          </div>
          <div className="py-6 ps-4 lg:ps-6 space-y-1">
            <div className="font-[family-name:var(--font-display)] text-title font-mono tabular-nums text-[var(--cv-text-primary)]">
              KS + PSI
            </div>
            <div className="text-caption text-[var(--cv-text-secondary)]">
              Numeric p &lt; 0.05 and categorical &gt; 0.25 alerts
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
