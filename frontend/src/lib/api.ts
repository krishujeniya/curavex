export interface ClinicalMetadata {
  conditions: string[];
  condition_drug_mapping: Record<string, string[]>;
}

export interface FeatureAttribution {
  feature: string;
  impact?: number;
  importance?: number;
}

export interface PredictionRequest {
  Age: number;
  Gender: string;
  Condition: string;
  Drug_Name: string;
  Dosage_mg: number;
  Treatment_Duration_days: number;
}

export interface PredictionResponse {
  predicted_score: number;
  confidence_interval: [number, number];
  effectiveness_level: "High" | "Medium" | "Low" | string;
  latency_ms: number;
  model_id: string;
  feature_attributions?: FeatureAttribution[];
}

export interface BatchPredictionResponse {
  total_processed: number;
  mean_predicted_score: number;
  min_predicted_score: number;
  max_predicted_score: number;
  batch_latency_ms: number;
  predictions: Array<{
    predicted_score: number;
    effectiveness_level: string;
    confidence_interval: [number, number];
  }>;
}

export interface RegisteredModel {
  model_id: string;
  algorithm: string;
  version: string;
  status: "PRODUCTION" | "STAGING" | "ARCHIVED" | string;
  metrics?: {
    rmse?: number;
    mae?: number;
  };
}

export interface TelemetryMetrics {
  total_inferences: number;
  throughput_req_per_min: number;
  error_rate_pct: number;
  latency_ms: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface DriftMetrics {
  overall_drift_detected: boolean;
  numeric_metrics?: Record<string, { p_value: number }>;
}

export interface AuditLogEntry {
  timestamp: string;
  model_id?: string;
  predicted_score?: number;
  effectiveness?: string;
  latency_ms?: number;
}

export interface ApiKeyRecord {
  name: string;
  tier: string;
  api_key: string;
  requests_per_minute: number;
  monthly_limit: number;
}

export const DEFAULT_API_KEY = "live_agyos_clinical_enterprise_key_99x";

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return "https://api-curavex.pages.dev";
  }

  const urlParams = new URLSearchParams(window.location.search);
  const paramBackend = urlParams.get("backend");
  if (paramBackend) return paramBackend.replace(/\/$/, "");

  const stored = window.localStorage.getItem("curavex_backend_url");
  if (stored) return stored.replace(/\/$/, "");

  if (
    window.location.hostname.includes("pages.dev") ||
    window.location.hostname.includes("curavex")
  ) {
    return "https://api-curavex.pages.dev";
  }

  return "";
}

async function apiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body: unknown = null,
  apiKey: string = DEFAULT_API_KEY,
): Promise<T> {
  const base = getApiBaseUrl();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": apiKey,
  };

  const options: RequestInit = { method, headers };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${base}/api/v1${endpoint}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json() as Promise<T>;
}

export const curavexApi = {
  getClinicalMetadata: () =>
    apiRequest<ClinicalMetadata>("/metadata/clinical"),

  predictSingle: (payload: PredictionRequest) =>
    apiRequest<PredictionResponse>("/predict", "POST", payload),

  uploadBatchCsv: async (
    file: File,
    apiKey: string = DEFAULT_API_KEY,
  ): Promise<BatchPredictionResponse> => {
    const base = getApiBaseUrl();
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${base}/api/v1/predict/upload-csv`, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json() as Promise<BatchPredictionResponse>;
  },

  listModels: () => apiRequest<RegisteredModel[]>("/models"),

  promoteModel: (modelId: string) =>
    apiRequest<{ status: string }>(`/models/${modelId}/promote`, "POST", {
      target_stage: "PRODUCTION",
    }),

  trainModel: (algorithm: string, version: string) =>
    apiRequest<{ status: string }>("/models/train", "POST", {
      algorithm,
      version,
      description: "Retrained candidate via web control plane",
    }),

  getTelemetry: () => apiRequest<TelemetryMetrics>("/monitoring/metrics"),

  getDrift: () => apiRequest<DriftMetrics>("/monitoring/drift"),

  getAuditLogs: (limit: number = 15) =>
    apiRequest<AuditLogEntry[]>(`/monitoring/logs?limit=${limit}`),

  listApiKeys: () => apiRequest<ApiKeyRecord[]>("/api-keys"),

  generateApiKey: (name: string, tier: string) =>
    apiRequest<ApiKeyRecord>("/api-keys/generate", "POST", { name, tier }),
};
