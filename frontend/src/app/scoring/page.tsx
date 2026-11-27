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
  const { clinicalMeta, billingStatus, refreshTelemetry, refreshDrift, refreshBilling } =
    useCuravex();

  const selectedPreset = React.useMemo(() => {
    if (!presetId) return null;
    const found = CLINICAL_PRESETS.find((p) => p.id === presetId);
    return found ? { preset: found, nonce: 1 } : null;
  }, [presetId]);

  return (
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
  );
}

export default function ScoringPage() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <React.Suspense fallback={null}>
        <ScoringContent />
      </React.Suspense>
    </section>
  );
}
