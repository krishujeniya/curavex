"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArchitectureSection } from "@/components/sections/ArchitectureSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { MethodologySection } from "@/components/sections/MethodologySection";
import { useCuravex } from "@/components/providers/CuravexProvider";
import type { ClinicalCasePreset } from "@/lib/clinical-validation";

export default function OverviewPage() {
  const router = useRouter();
  const { activeModel, telemetry, drift, datasetStats, apiStatus } =
    useCuravex();

  function handleStartScoring() {
    router.push("/scoring");
  }

  function handleSelectPreset(preset: ClinicalCasePreset) {
    router.push(`/scoring?preset=${encodeURIComponent(preset.id)}`);
  }

  return (
    <>
      <HeroSection
        activeModel={activeModel}
        telemetry={telemetry}
        drift={drift}
        datasetStats={datasetStats}
        apiStatus={apiStatus}
        onStartScoring={handleStartScoring}
        onSelectPreset={handleSelectPreset}
      />
      <ArchitectureSection />
      <MethodologySection datasetStats={datasetStats} />
    </>
  );
}
