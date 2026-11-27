"use client";

import * as React from "react";
import { useCuravex } from "@/components/providers/CuravexProvider";
import { MonitoringTab } from "@/components/workspace/MonitoringTab";

export default function MonitoringPage() {
  const { telemetry, drift, auditLogs, refreshTelemetry, refreshDrift } =
    useCuravex();

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      void Promise.allSettled([refreshTelemetry(), refreshDrift()]);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [refreshTelemetry, refreshDrift]);

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <MonitoringTab
        telemetry={telemetry}
        drift={drift}
        auditLogs={auditLogs}
        onRefresh={async () => {
          await Promise.allSettled([refreshTelemetry(), refreshDrift()]);
        }}
      />
    </section>
  );
}
