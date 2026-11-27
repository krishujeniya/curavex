"use client";

import * as React from "react";
import { useCuravex } from "@/components/providers/CuravexProvider";
import { ApiKeysTab } from "@/components/workspace/ApiKeysTab";

export default function ApiKeysPage() {
  const { apiKeys, refreshApiKeys } = useCuravex();

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <ApiKeysTab apiKeys={apiKeys} onKeysUpdated={refreshApiKeys} />
    </section>
  );
}
