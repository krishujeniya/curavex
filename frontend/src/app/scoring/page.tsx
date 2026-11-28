"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useCuravex } from "@/components/providers/CuravexProvider";
import { AuthGate } from "@/components/auth/AuthGate";
import { PredictTab } from "@/components/workspace/PredictTab";
import { CLINICAL_PRESETS } from "@/lib/clinical-validation";

function ScoringContent() {
  const searchParams = useSearchParams();
  const presetId = searchParams.get("preset");
  const {
    clinicalMeta,
    billingStatus,
    refreshTelemetry,
    refreshDrift,
    refreshBilling,
  } = useCuravex();

  const selectedPreset = React.useMemo(() => {
    if (!presetId) return null;
    const found = CLINICAL_PRESETS.find((p) => p.id === presetId);
    return found ? { preset: found, nonce: 1 } : null;
  }, [presetId]);

  return (
    <div className="space-y-8">
      <div className="space-y-3 max-w-[65ch]">
        <p className="text-caption font-medium uppercase tracking-[0.18em] text-[var(--cv-text-secondary)]">
          Workspace
        </p>
        <h1 className="text-title text-[var(--cv-text-primary)]">
          Patient scoring
        </h1>
        <p className="text-body text-[var(--cv-text-secondary)]">
          Score an individual patient regimen with calibrated confidence
          intervals and feature attribution.
        </p>
      </div>

      <AuthGate
        title="Sign in to score patients"
        description="Create a free account to get 5 scoring requests per month, or sign in to continue."
      >
        <PredictTab
          clinicalMeta={clinicalMeta}
          selectedPreset={selectedPreset}
          billingStatus={billingStatus}
          onPredictionComplete={() => {
            void Promise.allSettled([
              refreshTelemetry(),
              refreshDrift(),
              refreshBilling(),
            ]);
          }}
        />
      </AuthGate>
    </div>
  );
}

export default function ScoringPage() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <React.Suspense fallback={null}>
        <ScoringContent />
      </React.Suspense>
    </section>
  );
}
