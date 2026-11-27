"use client";

import * as React from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { useCuravex } from "@/components/providers/CuravexProvider";
import { ApiKeysTab } from "@/components/workspace/ApiKeysTab";

export default function ApiKeysPage() {
  const { apiKeys, refreshApiKeys } = useCuravex();

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <AuthGate
        title="Sign in to manage API keys"
        description="Sign in with your Curavex account to provision and view API keys."
      >
        <ApiKeysTab apiKeys={apiKeys} onKeysUpdated={refreshApiKeys} />
      </AuthGate>
    </section>
  );
}
