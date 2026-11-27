"use client";

import * as React from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
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

interface CuravexContextValue {
  clinicalMeta: ClinicalMetadata | null;
  datasetStats: DatasetStats | null;
  models: RegisteredModel[];
  activeModel: RegisteredModel | null;
  telemetry: TelemetryMetrics | null;
  drift: DriftMetrics | null;
  auditLogs: AuditLogEntry[];
  apiKeys: ApiKeyRecord[];
  apiStatus: "live" | "connecting" | "offline";
  docsUrl: string;
  refreshModels: () => Promise<void>;
  refreshTelemetry: () => Promise<void>;
  refreshDrift: () => Promise<void>;
  refreshApiKeys: () => Promise<void>;
}

const CuravexContext = React.createContext<CuravexContextValue | null>(null);

export function useCuravex(): CuravexContextValue {
  const ctx = React.useContext(CuravexContext);
  if (!ctx) {
    throw new Error("useCuravex must be used inside CuravexProvider");
  }
  return ctx;
}

export function CuravexProvider({ children }: { children: React.ReactNode }) {
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

  const value = React.useMemo<CuravexContextValue>(
    () => ({
      clinicalMeta,
      datasetStats,
      models,
      activeModel,
      telemetry,
      drift,
      auditLogs,
      apiKeys,
      apiStatus,
      docsUrl,
      refreshModels,
      refreshTelemetry,
      refreshDrift,
      refreshApiKeys,
    }),
    [
      clinicalMeta,
      datasetStats,
      models,
      activeModel,
      telemetry,
      drift,
      auditLogs,
      apiKeys,
      apiStatus,
      docsUrl,
      refreshModels,
      refreshTelemetry,
      refreshDrift,
      refreshApiKeys,
    ],
  );

  return (
    <CuravexContext.Provider value={value}>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter docsUrl={docsUrl} />
    </CuravexContext.Provider>
  );
}
