"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCuravex } from "@/components/providers/CuravexProvider";
import { AuthGate } from "@/components/auth/AuthGate";
import { ApiKeysTab } from "@/components/workspace/ApiKeysTab";
import { ApiKeyDashboard } from "@/components/workspace/ApiKeyDashboard";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/wensity/tabs";

function MonitoringContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab =
    rawTab === "dashboard" || rawTab === "metrics" ? "dashboard" : "create";
  const { apiKeys, refreshApiKeys } = useCuravex();

  function handleTabChange(value: string) {
    if (value === "dashboard") router.replace("/monitoring?tab=dashboard");
    else router.replace("/monitoring");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3 max-w-[65ch]">
        <h1 className="text-display leading-[1.05] tracking-[-0.03em] text-[var(--cv-text-primary)]">
          API Keys
        </h1>
      </div>

      <Tabs variant="segmented" value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="create">Create</TabsTrigger>
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
      </TabsList>

      <TabsContent value="create" className="pt-2">
        <AuthGate
          title="Sign in to manage API keys"
          description="Sign in with your Curavex account to provision and view API keys."
        >
          <ApiKeysTab apiKeys={apiKeys} onKeysUpdated={refreshApiKeys} />
        </AuthGate>
      </TabsContent>

      <TabsContent value="dashboard" className="pt-2">
        <AuthGate
          title="Sign in to view API usage"
          description="Sign in with your Curavex account to see API key usage and limits."
        >
          <ApiKeyDashboard />
        </AuthGate>
      </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MonitoringPage() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <React.Suspense fallback={null}>
        <MonitoringContent />
      </React.Suspense>
    </section>
  );
}
