"use client";

import * as React from "react";
import { useAuth } from "@clerk/react";
import { isClerkConfigured } from "@/components/auth/ClerkAuthWrapper";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  curavexApi,
  getApiBaseUrl,
  setAuthTokenGetter,
  type ApiKeyRecord,
  type AuditLogEntry,
  type BillingStatus,
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
  billingStatus: BillingStatus | null;
  apiStatus: "live" | "connecting" | "offline";
  docsUrl: string;
  refreshModels: () => Promise<void>;
  refreshTelemetry: () => Promise<void>;
  refreshDrift: () => Promise<void>;
  refreshApiKeys: () => Promise<void>;
  refreshBilling: () => Promise<void>;
}

const CuravexContext = React.createContext<CuravexContextValue | null>(null);

export function useCuravex(): CuravexContextValue {
  const ctx = React.useContext(CuravexContext);
  if (!ctx) {
    throw new Error("useCuravex must be used inside CuravexProvider");
  }
  return ctx;
}

function ClerkTokenBridge({
  onSignedInChange,
}: {
  onSignedInChange: (signedIn: boolean) => void;
}) {
  const { isSignedIn, getToken } = useAuth();

  React.useEffect(() => {
    setAuthTokenGetter(() => getToken());
    onSignedInChange(Boolean(isSignedIn));
    return () => setAuthTokenGetter(null);
  }, [getToken, isSignedIn, onSignedInChange]);

  return null;
}

export function CuravexProvider({ children }: { children: React.ReactNode }) {
  const [docsUrl, setDocsUrl] = React.useState(
    "https://api.curavex.workers.dev/docs",
  );
  const [apiStatus, setApiStatus] = React.useState<
    "live" | "connecting" | "offline"
  >("connecting");
  const [signedIn, setSignedIn] = React.useState(false);

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
  const [billingStatus, setBillingStatus] =
    React.useState<BillingStatus | null>(null);

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

  const refreshBilling = React.useCallback(async () => {
    try {
      const status = await curavexApi.getBillingStatus();
      setBillingStatus(status);
    } catch {
      setBillingStatus(null);
    }
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
    if (signedIn) {
      void refreshBilling();
    } else {
      setBillingStatus(null);
    }
  }, [signedIn, refreshBilling]);

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
      billingStatus,
      apiStatus,
      docsUrl,
      refreshModels,
      refreshTelemetry,
      refreshDrift,
      refreshApiKeys,
      refreshBilling,
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
      billingStatus,
      apiStatus,
      docsUrl,
      refreshModels,
      refreshTelemetry,
      refreshDrift,
      refreshApiKeys,
      refreshBilling,
    ],
  );

  return (
    <CuravexContext.Provider value={value}>
      {isClerkConfigured() && (
        <ClerkTokenBridge onSignedInChange={setSignedIn} />
      )}
      <SiteHeader docsUrl={docsUrl} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter docsUrl={docsUrl} />
    </CuravexContext.Provider>
  );
}
