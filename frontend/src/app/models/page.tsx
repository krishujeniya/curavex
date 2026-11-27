"use client";

import * as React from "react";
import { useCuravex } from "@/components/providers/CuravexProvider";
import { MlopsTab } from "@/components/workspace/MlopsTab";

export default function ModelsPage() {
  const { models, activeModel, refreshModels } = useCuravex();

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <MlopsTab
        models={models}
        activeModel={activeModel}
        onModelsUpdated={refreshModels}
      />
    </section>
  );
}
