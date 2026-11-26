"use client";

import * as React from "react";
import { HamburgerMenu } from "@/components/wensity/animated-hamburger-menu";
import { Kbd } from "@/components/wensity/kbd";
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
  type DriftMetrics,
  type RegisteredModel,
  type TelemetryMetrics,
} from "@/lib/api";

type TabId = "predict" | "batch" | "mlops" | "monitoring" | "apikeys";

const WORKSPACE_TABS: Array<{ id: TabId; label: string }> = [
  { id: "predict", label: "Clinical decision support" },
  { id: "batch", label: "Batch cohort scoring" },
  { id: "mlops", label: "Model governance" },
  { id: "monitoring", label: "Observability and drift" },
  { id: "apikeys", label: "Developer API" },
];

export default function CuravexWorkspacePage() {
  const [activeTab, setActiveTab] = React.useState<TabId>("predict");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [docsUrl, setDocsUrl] = React.useState(
    "https://api-curavex.pages.dev/docs",
  );

  const [clinicalMeta, setClinicalMeta] =
    React.useState<ClinicalMetadata | null>(null);
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

  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const refreshModels = React.useCallback(async () => {
    try {
      const list = await curavexApi.listModels();
      setModels(list);
      setActiveModel(
        list.find((m) => m.status === "PRODUCTION") ?? list[0] ?? null,
      );
    } catch {
      // Initial offline/dev fallback leaves previous state intact
    }
  }, []);

  const refreshTelemetry = React.useCallback(async () => {
    try {
      const [metrics, logs] = await Promise.all([
        curavexApi.getTelemetry(),
        curavexApi.getAuditLogs(15),
      ]);
      setTelemetry(metrics);
      setAuditLogs(logs);
    } catch {
      // Handled gracefully in monitoring view
    }
  }, []);

  const refreshDrift = React.useCallback(async () => {
    try {
      const data = await curavexApi.getDrift();
      setDrift(data);
    } catch {
      // Handled gracefully in monitoring view
    }
  }, []);

  const refreshApiKeys = React.useCallback(async () => {
    try {
      const keys = await curavexApi.listApiKeys();
      setApiKeys(keys);
    } catch {
      // Handled gracefully in developer view
    }
  }, []);

  React.useEffect(() => {
    const base = getApiBaseUrl();
    if (base) setDocsUrl(`${base}/docs`);

    void curavexApi
      .getClinicalMetadata()
      .then(setClinicalMeta)
      .catch(() => undefined);
    void refreshModels();
    void refreshTelemetry();
    void refreshDrift();
    void refreshApiKeys();
  }, [refreshModels, refreshTelemetry, refreshDrift, refreshApiKeys]);

  React.useEffect(() => {
    if (activeTab !== "monitoring") return;
    const timer = window.setInterval(() => {
      void refreshTelemetry();
      void refreshDrift();
    }, 6000);
    return () => window.clearInterval(timer);
  }, [activeTab, refreshTelemetry, refreshDrift]);

  function handleTabKeyDown(e: React.KeyboardEvent, index: number) {
    const nextIndex =
      e.key === "ArrowRight"
        ? (index + 1) % WORKSPACE_TABS.length
        : e.key === "ArrowLeft"
          ? (index + WORKSPACE_TABS.length - 1) % WORKSPACE_TABS.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? WORKSPACE_TABS.length - 1
              : -1;

    if (nextIndex >= 0) {
      e.preventDefault();
      setActiveTab(WORKSPACE_TABS[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-[var(--cv-border)] bg-[var(--cv-canvas)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="./assets/curavex-logo.png"
              alt="Curavex logo"
              className="h-8 w-8 rounded border border-[var(--cv-border)] object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="text-label font-semibold tracking-tight text-[var(--cv-text-primary)] truncate">
                Curavex
              </div>
              <p className="text-caption text-[var(--cv-text-secondary)] truncate">
                Treatment response regression and efficacy governance
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-caption text-[var(--cv-text-secondary)] shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--cv-text-primary)]" />
              <span>
                Active:{" "}
                <code className="font-mono text-[var(--cv-text-primary)]">
                  {activeModel?.model_id ?? "loading…"}
                </code>
              </span>
            </div>
            <span className="h-4 w-px bg-[var(--cv-border)]" />
            <div className="font-mono tabular-nums">
              p50:{" "}
              <span className="text-[var(--cv-text-primary)]">
                {telemetry?.latency_ms?.p50 ?? "0.0"} ms
              </span>
            </div>
            <span className="h-4 w-px bg-[var(--cv-border)]" />
            <span className="rounded border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2 py-0.5 font-mono text-[var(--cv-text-primary)]">
              {drift
                ? drift.overall_drift_detected
                  ? "Drift detected"
                  : "Distribution stable"
                : "Checking…"}
            </span>
            <span className="h-4 w-px bg-[var(--cv-border)]" />
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[var(--cv-text-primary)] hover:underline"
            >
              API docs ↗
            </a>
          </div>

          <div className="md:hidden">
            <HamburgerMenu
              variant="squeeze"
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
              aria-controls="mobile-workspace-nav"
              aria-label="Toggle workspace navigation"
            />
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            id="mobile-workspace-nav"
            aria-label="Mobile workspace views"
            className="border-t border-[var(--cv-border)] bg-[var(--cv-surface)] px-4 py-3 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {WORKSPACE_TABS.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`min-h-[44px] rounded-md px-3 py-2 text-start text-label transition-colors ${
                      isSelected
                        ? "bg-[var(--cv-surface-raised)] text-[var(--cv-text-primary)]"
                        : "text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <nav
          aria-label="Workspace views"
          role="tablist"
          className="hidden md:flex mx-auto max-w-[1440px] items-center gap-2 overflow-x-auto border-t border-[var(--cv-border)] px-4 sm:px-6 lg:px-8"
        >
          {WORKSPACE_TABS.map((tab, index) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                id={`workspace-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isSelected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`min-h-[44px] whitespace-nowrap border-b-2 px-3 py-2.5 text-label transition-colors ${
                  isSelected
                    ? "border-[var(--cv-text-primary)] text-[var(--cv-text-primary)]"
                    : "border-transparent text-[var(--cv-text-secondary)] hover:text-[var(--cv-text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          <div className="ms-auto hidden xl:flex items-center gap-1.5 text-caption text-[var(--cv-text-secondary)]">
            <span>Switch tabs:</span>
            <Kbd>←</Kbd>
            <Kbd>→</Kbd>
          </div>
        </nav>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
      >
        <div
          id="panel-predict"
          role="tabpanel"
          aria-labelledby="workspace-tab-predict"
          hidden={activeTab !== "predict"}
        >
          {activeTab === "predict" && (
            <PredictTab
              clinicalMeta={clinicalMeta}
              onPredictionComplete={() => {
                void refreshTelemetry();
              }}
            />
          )}
        </div>

        <div
          id="panel-batch"
          role="tabpanel"
          aria-labelledby="workspace-tab-batch"
          hidden={activeTab !== "batch"}
        >
          {activeTab === "batch" && <BatchTab />}
        </div>

        <div
          id="panel-mlops"
          role="tabpanel"
          aria-labelledby="workspace-tab-mlops"
          hidden={activeTab !== "mlops"}
        >
          {activeTab === "mlops" && (
            <MlopsTab
              models={models}
              activeModel={activeModel}
              onModelsUpdated={refreshModels}
            />
          )}
        </div>

        <div
          id="panel-monitoring"
          role="tabpanel"
          aria-labelledby="workspace-tab-monitoring"
          hidden={activeTab !== "monitoring"}
        >
          {activeTab === "monitoring" && (
            <MonitoringTab
              telemetry={telemetry}
              drift={drift}
              auditLogs={auditLogs}
            />
          )}
        </div>

        <div
          id="panel-apikeys"
          role="tabpanel"
          aria-labelledby="workspace-tab-apikeys"
          hidden={activeTab !== "apikeys"}
        >
          {activeTab === "apikeys" && (
            <ApiKeysTab apiKeys={apiKeys} onKeysUpdated={refreshApiKeys} />
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--cv-border)] py-4 text-center text-caption font-mono text-[var(--cv-text-secondary)]">
        Curavex Clinical Response Engine · Contract-first REST API · Model
        Governance
      </footer>
    </>
  );
}
