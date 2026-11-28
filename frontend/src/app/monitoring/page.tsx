"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCuravex } from "@/components/providers/CuravexProvider";
import { AuthGate } from "@/components/auth/AuthGate";
import { MonitoringTab } from "@/components/workspace/MonitoringTab";
import { ApiKeysTab } from "@/components/workspace/ApiKeysTab";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/wensity/tabs";

function MonitoringContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "keys" ? "keys" : "metrics";
  const {
    telemetry,
    drift,
    auditLogs,
    apiKeys,
    refreshApiKeys,
    refreshTelemetry,
    refreshDrift,
  } = useCuravex();

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      void Promise.allSettled([refreshTelemetry(), refreshDrift()]);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [refreshTelemetry, refreshDrift]);

  function handleTabChange(value: string) {
    if (value === "keys") router.replace("/monitoring?tab=keys");
    else router.replace("/monitoring");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3 max-w-[65ch]">
        <h1 className="text-display leading-[1.05] tracking-[-0.03em] text-[var(--cv-text-primary)]">
          Monitoring &amp; access
        </h1>
      </div>

      <Tabs variant="segmented" value={tab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="metrics">Monitoring</TabsTrigger>
        <TabsTrigger value="keys">API keys</TabsTrigger>
      </TabsList>

      <TabsContent value="metrics" className="pt-2">
        <MonitoringTab
          telemetry={telemetry}
          drift={drift}
          auditLogs={auditLogs}
          onRefresh={async () => {
            await Promise.allSettled([refreshTelemetry(), refreshDrift()]);
          }}
        />
      </TabsContent>

      <TabsContent value="keys" className="pt-2">
        <AuthGate
          title="Sign in to manage API keys"
          description="Sign in with your Curavex account to provision and view API keys."
        >
          <ApiKeysTab apiKeys={apiKeys} onKeysUpdated={refreshApiKeys} />
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
