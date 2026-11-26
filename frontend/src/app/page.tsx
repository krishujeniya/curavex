"use client";

import * as React from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  WorkspaceCommand,
  type WorkspaceTabId,
} from "@/components/layout/WorkspaceCommand";
import { ArchitectureSection } from "@/components/sections/ArchitectureSection";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { MethodologySection } from "@/components/sections/MethodologySection";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/wensity/tabs";
import { ApiKeysTab } from "@/components/workspace/ApiKeysTab";
import { BatchTab } from "@/components/workspace/BatchTab";
import { MlopsTab } from "@/components/workspace/MlopsTab";
import { MonitoringTab } from "@/components/workspace/MonitoringTab";
import { PredictTab } from "@/components/workspace/PredictTab";
import {
  curavexApi,
  getApiBaseUrl,
  type ApiKeyRecord,
  type AuditLogEntry,
  type ClinicalMetadata,
  type DatasetStats,
  type DriftMetrics,
  type RegisteredModel,
  type TelemetryMetrics,
} from "@/lib/api";
import type { ClinicalCasePreset } from "@/lib/clinical-validation";

const WORKSPACE_TABS: Array<{ id: WorkspaceTabId; label: string }> = [
  { id: "predict", label: "Clinical decision support" },
  { id: "batch", label: "Batch cohort scoring" },
  { id: "mlops", label: "Model governance" },
  { id: "monitoring", label: "Observability and drift" },
  { id: "apikeys", label: "Developer API" },
];

export default function CuravexWorkspacePage() {
  const [activeTab, setActiveTab] = React.useState<WorkspaceTabId>("predict");
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [docsUrl, setDocsUrl] = React.useState(
    "https://api-curavex.pages.dev/docs",
  );
  const [apiStatus, setApiStatus] = React.useState<
    "live" | "connecting" | "offline"
  >("connecting");

  const [clinicalMeta, setClinicalMeta] =
    React.useState<ClinicalMetadata | null>(null);
  const [datasetStats, setDatasetStats] = React.useState<DatasetStats | null>(
    null,
  );
  const [models, setModels] = React.useState<RegisteredModel[]>([]);
  const [activeModel, setActiveModel] = React.useState<RegisteredModel | null>(
    null,
  );
  const [telemetry, setTelemetry] = React.useState<TelemetryMetrics | null>(
    null,
  );
  const [drift, setDrift] = React.useState<DriftMetrics | null>(null);
  const [auditLogs, setAuditLogs] = React.useState<AuditLogEntry[]>([]);
  const [apiKeys, setApiKeys] = React.useState<ApiKeyRecord[]>([]);
  const [selectedPreset, setSelectedPreset] = React.useState<{
    preset: ClinicalCasePreset;
    nonce: number;
  } | null>(null);

  const refreshModels = React.useCallback(async () => {
    const list = await curavexApi.listModels();
    setModels(list);
    setActiveModel(
      list.find((m) => m.status === "PRODUCTION") ?? list[0] ?? null,
    );
  }, []);

  const refreshTelemetry = React.useCallback(async () => {
    const [metrics, logs] = await Promise.all([
      curavexApi.getTelemetry(),
      curavexApi.getAuditLogs(15),
    ]);
    setTelemetry(metrics);
    setAuditLogs(logs);
  }, []);

  const refreshDrift = React.useCallback(async () => {
    const data = await curavexApi.getDrift();
    setDrift(data);
  }, []);

  const refreshApiKeys = React.useCallback(async () => {
    const keys = await curavexApi.listApiKeys();
    setApiKeys(keys);
  }, []);

  React.useEffect(() => {
    const base = getApiBaseUrl();
    if (base) setDocsUrl(`${base}/docs`);

    let mounted = true;
    async function bootstrap() {
      const results = await Promise.allSettled([
        curavexApi.getClinicalMetadata().then((m) => {
          if (mounted) setClinicalMeta(m);
        }),
        curavexApi.getDatasetStats().then((s) => {
          if (mounted) setDatasetStats(s);
        }),
        refreshModels(),
        refreshTelemetry(),
        refreshDrift(),
        refreshApiKeys(),
      ]);

      if (!mounted) return;
      const anySuccess = results.some((r) => r.status === "fulfilled");
      setApiStatus(anySuccess ? "live" : "offline");
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [refreshApiKeys, refreshDrift, refreshModels, refreshTelemetry]);

  React.useEffect(() => {
    if (activeTab !== "monitoring") return;
    const timer = window.setInterval(() => {
      void Promise.allSettled([refreshTelemetry(), refreshDrift()]);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [activeTab, refreshTelemetry, refreshDrift]);

  function scrollToWorkspace(targetTab?: WorkspaceTabId) {
    if (targetTab) setActiveTab(targetTab);
    const el = document.getElementById("workspace");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSelectPreset(preset: ClinicalCasePreset) {
    setSelectedPreset({ preset, nonce: Date.now() });
    scrollToWorkspace("predict");
  }

  return (
    <>
      <SiteHeader
        activeModelId={activeModel?.model_id}
        apiStatus={apiStatus}
        docsUrl={docsUrl}
        onOpenCommand={() => setCommandOpen(true)}
        onJumpToWorkspace={() => scrollToWorkspace()}
      />

      <WorkspaceCommand
        open={commandOpen}
        onOpenChange={setCommandOpen}
        docsUrl={docsUrl}
        onSelectTab={(tab) => scrollToWorkspace(tab)}
        onLoadPreset={handleSelectPreset}
      />

      <main id="main-content" className="flex-1">
        <HeroSection
          activeModel={activeModel}
          telemetry={telemetry}
          drift={drift}
          datasetStats={datasetStats}
          apiStatus={apiStatus}
          onStartScoring={() => scrollToWorkspace("predict")}
          onSelectPreset={handleSelectPreset}
        />

        <section
          id="workspace"
          className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        >
          <Tabs
            variant="underline"
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as WorkspaceTabId)}
            className="space-y-6"
          >
            <div className="border-b border-[var(--cv-border)] overflow-x-auto">
              <TabsList className="min-w-max">
                {WORKSPACE_TABS.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="min-h-[44px]">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="predict">
              <PredictTab
                clinicalMeta={clinicalMeta}
                selectedPreset={selectedPreset}
                onPredictionComplete={() => {
                  void Promise.allSettled([refreshTelemetry(), refreshDrift()]);
                }}
              />
            </TabsContent>

            <TabsContent value="batch">
              <BatchTab />
            </TabsContent>

            <TabsContent value="mlops">
              <MlopsTab
                models={models}
                activeModel={activeModel}
                onModelsUpdated={refreshModels}
              />
            </TabsContent>

            <TabsContent value="monitoring">
              <MonitoringTab
                telemetry={telemetry}
                drift={drift}
                auditLogs={auditLogs}
                onRefresh={async () => {
                  await Promise.allSettled([refreshTelemetry(), refreshDrift()]);
                }}
              />
            </TabsContent>

            <TabsContent value="apikeys">
              <ApiKeysTab apiKeys={apiKeys} onKeysUpdated={refreshApiKeys} />
            </TabsContent>
          </Tabs>
        </section>

        <ArchitectureSection />
        <MethodologySection datasetStats={datasetStats} />
        <FinalCtaSection
          docsUrl={docsUrl}
          onOpenApiTab={() => scrollToWorkspace("apikeys")}
        />
      </main>

      <SiteFooter docsUrl={docsUrl} />
    </>
  );
}
