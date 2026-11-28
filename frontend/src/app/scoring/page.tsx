"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCuravex } from "@/components/providers/CuravexProvider";
import { AuthGate } from "@/components/auth/AuthGate";
import { PredictTab } from "@/components/workspace/PredictTab";
import { MlopsTab } from "@/components/workspace/MlopsTab";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/wensity/tabs";
import { CLINICAL_PRESETS } from "@/lib/clinical-validation";

function ScoringContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetId = searchParams.get("preset");
  const tab = searchParams.get("tab") === "models" ? "models" : "score";
  const {
    clinicalMeta,
    billingStatus,
    models,
    activeModel,
    refreshModels,
    refreshTelemetry,
    refreshDrift,
    refreshBilling,
  } = useCuravex();

  const selectedPreset = React.useMemo(() => {
    if (!presetId) return null;
    const found = CLINICAL_PRESETS.find((p) => p.id === presetId);
    return found ? { preset: found, nonce: 1 } : null;
  }, [presetId]);

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("preset");
    if (value === "models") params.set("tab", "models");
    else params.delete("tab");
    const query = params.toString();
    router.replace(query ? `/scoring?${query}` : "/scoring");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3 max-w-[65ch]">
        <p className="text-caption font-medium uppercase tracking-[0.18em] text-[var(--cv-text-secondary)]">
          Workspace
        </p>
        <h1 className="text-title text-[var(--cv-text-primary)]">
          Scoring &amp; models
        </h1>
        <p className="text-body text-[var(--cv-text-secondary)]">
          Score patient regimens individually or as CSV cohorts, and govern the
          models behind every prediction.
        </p>
      </div>

      <Tabs
        variant="segmented"
        value={tab}
        onValueChange={handleTabChange}
      >
        <TabsList>
          <TabsTrigger value="score">Scoring</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>

        <TabsContent value="score" className="pt-2">
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
        </TabsContent>

        <TabsContent value="models" className="pt-2">
          <MlopsTab
            models={models}
            activeModel={activeModel}
            onModelsUpdated={refreshModels}
          />
        </TabsContent>
      </Tabs>
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
