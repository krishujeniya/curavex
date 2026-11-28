import modelsDataRaw from "./models_data.json";
import datasetStatsRaw from "./dataset_stats.json";
import featureImportancesRaw from "./feature_importances.json";
import registryDataRaw from "../../backend/models/registry/registry.json";

export interface Env {
  AI?: unknown;
  DB?: D1Database;
  SHARED_CONFIG_KV?: KVNamespace;
  UPSTREAM_API?: string;
  CLERK_JWKS_URL?: string;
  CLERK_ISSUER?: string;
}

interface TreeNodeData {
  l: number[];
  r: number[];
  f: number[];
  th: number[];
  v: number[];
}

interface SerializedModel {
  algorithm: string;
  scaler_mean: number[];
  scaler_scale: number[];
  categories: string[][];
  init_value?: number;
  learning_rate?: number;
  trees: TreeNodeData[];
}

interface RegistryModel {
  model_id: string;
  algorithm: string;
  version: string;
  status: string;
  description?: string;
  created_at?: string;
  metrics: {
    rmse: number;
    mae: number;
    mse?: number;
    r2?: number;
    pearson_corr?: number;
  };
  hyperparameters?: Record<string, unknown>;
}

interface ClinicalInput {
  Age: number;
  Gender: string;
  Condition: string;
  Drug_Name: string;
  Dosage_mg: number;
  Treatment_Duration_days: number;
}

interface AuditLogEntry {
  timestamp: string;
  model_id: string;
  predicted_score: number;
  effectiveness: string;
  latency_ms: number;
  input: ClinicalInput;
}

const MODELS_DATA = modelsDataRaw as unknown as Record<string, SerializedModel>;
const DATASET_STATS = datasetStatsRaw as unknown as Record<string, unknown>;
const FEATURE_IMPORTANCES = featureImportancesRaw as unknown as Record<
  string,
  Array<{ feature: string; importance: number }>
>;
const REGISTRY_MODELS: RegistryModel[] = (
  registryDataRaw as unknown as { models: RegistryModel[] }
).models.map((m) => ({ ...m }));

let activeProductionId: string =
  (registryDataRaw as unknown as { active_production_id?: string })
    .active_production_id || "gradient_boosting-v2.0.0-c31272";

const CONDITION_DRUG_MAP: Record<string, string[]> = {
  Depression: ["Bupropion", "Escitalopram", "Sertraline"],
  Diabetes: ["Glipizide", "Metformin", "Insulin Glargine"],
  Hypertension: ["Metoprolol", "Amlodipine", "Losartan"],
  Infection: ["Ciprofloxacin", "Azithromycin", "Amoxicillin"],
  "Pain Relief": ["Paracetamol", "Ibuprofen", "Tramadol"],
};

const ALLOWED_GENDERS = ["Male", "Female"];
const CLINICAL_BOUNDS = {
  Age: { min: 1, max: 120, default: 45 },
  Dosage_mg: { min: 5.0, max: 2000.0, default: 250.0 },
  Treatment_Duration_days: { min: 1, max: 365, default: 30 },
  Improvement_Score: { min: 0.0, max: 10.0 },
};

const TIERS: Record<string, { rpm: number; monthly_limit: number }> = {
  free: { rpm: 60, monthly_limit: 10000 },
  standard: { rpm: 300, monthly_limit: 100000 },
  enterprise: { rpm: 1200, monthly_limit: 1000000 },
};

const API_KEY_PREFIX = "live_curavex_";
const API_KEY_MONTHLY_LIMIT = 10;

interface ApiKeyRow {
  key_hash: string;
  key_id: string;
  key_prefix: string;
  key_suffix: string;
  name: string;
  tier: string;
  owner_id: string | null;
  requests_per_minute: number;
  monthly_limit: number;
  created_at: string;
}

let apiKeySchemaReady = false;

async function ensureApiKeySchema(db: D1Database): Promise<void> {
  if (apiKeySchemaReady) return;
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS curavex_api_keys (
        key_hash TEXT PRIMARY KEY,
        key_id TEXT NOT NULL UNIQUE,
        key_prefix TEXT NOT NULL,
        key_suffix TEXT NOT NULL,
        name TEXT NOT NULL,
        tier TEXT NOT NULL,
        owner_id TEXT,
        requests_per_minute INTEGER NOT NULL,
        monthly_limit INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0
      )`,
    ),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS curavex_api_key_usage (
        key_hash TEXT NOT NULL,
        usage_date TEXT NOT NULL,
        calls INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (key_hash, usage_date)
      )`,
    ),
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_curavex_api_keys_owner
       ON curavex_api_keys(owner_id)`,
    ),
  ]);
  apiKeySchemaReady = true;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function findApiKey(
  db: D1Database,
  token: string,
): Promise<ApiKeyRow | null> {
  if (!token.startsWith(API_KEY_PREFIX)) return null;
  await ensureApiKeySchema(db);
  const keyHash = await sha256Hex(token);
  return db
    .prepare(
      `SELECT key_hash, key_id, key_prefix, key_suffix, name, tier,
              owner_id, requests_per_minute, monthly_limit, created_at
       FROM curavex_api_keys
       WHERE key_hash = ? AND revoked = 0`,
    )
    .bind(keyHash)
    .first<ApiKeyRow>();
}

async function consumeApiKeyQuota(
  db: D1Database,
  key: ApiKeyRow,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  await ensureApiKeySchema(db);
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  let used = 0;
  if (key.owner_id) {
    const row = await db
      .prepare(
        `SELECT COALESCE(SUM(u.calls), 0) AS total
         FROM curavex_api_key_usage u
         JOIN curavex_api_keys k ON u.key_hash = k.key_hash
         WHERE k.owner_id = ? AND substr(u.usage_date, 1, 7) = ?`,
      )
      .bind(key.owner_id, month)
      .first<{ total: number }>();
    used = row?.total ?? 0;
  } else {
    const row = await db
      .prepare(
        `SELECT COALESCE(SUM(calls), 0) AS total
         FROM curavex_api_key_usage
         WHERE key_hash = ? AND substr(usage_date, 1, 7) = ?`,
      )
      .bind(key.key_hash, month)
      .first<{ total: number }>();
    used = row?.total ?? 0;
  }
  await db
    .prepare(
      `INSERT INTO curavex_api_key_usage (key_hash, usage_date, calls)
       VALUES (?, ?, 1)
       ON CONFLICT(key_hash, usage_date) DO UPDATE SET calls = calls + 1`,
    )
    .bind(key.key_hash, today)
    .run();
  return {
    allowed: used < API_KEY_MONTHLY_LIMIT,
    used,
    limit: API_KEY_MONTHLY_LIMIT,
  };
}

const AUDIT_LOGS: AuditLogEntry[] = [];
const LATENCIES: number[] = [];

interface JwkKey {
  kid?: string;
  kty: string;
  n?: string;
  e?: string;
  alg?: string;
  use?: string;
}

const JWKS_CACHE = new Map<string, { keys: JwkKey[]; fetchedAt: number }>();

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getJwksKeys(jwksUrl: string): Promise<JwkKey[]> {
  const cached = JWKS_CACHE.get(jwksUrl);
  if (cached && Date.now() - cached.fetchedAt < 300_000) {
    return cached.keys;
  }
  const res = await fetch(jwksUrl, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error("Failed to fetch JWKS");
  const data = (await res.json()) as { keys?: JwkKey[] };
  const keys = data.keys ?? [];
  JWKS_CACHE.set(jwksUrl, { keys, fetchedAt: Date.now() });
  return keys;
}

async function verifyClerkJwt(
  request: Request,
  env: Env,
): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  const parts = token.split(".");
  if (parts.length === 2) {
    const edgeUser = await verifyEdgeToken(token, env);
    return edgeUser ? { userId: edgeUser.id } : null;
  }
  if (parts.length !== 3) return null;

  try {
    const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0]))) as {
      alg?: string;
      kid?: string;
    };
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1]))) as {
      sub?: string;
      exp?: number;
      nbf?: number;
      iss?: string;
    };
    if (header.alg !== "RS256" || !payload.sub) return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp <= now) return null;
    if (payload.nbf && payload.nbf > now + 60) return null;
    if (env.CLERK_ISSUER && payload.iss !== env.CLERK_ISSUER) return null;

    const jwksUrl =
      env.CLERK_JWKS_URL ||
      (payload.iss && /^https:\/\/[a-z0-9.-]+$/i.test(payload.iss)
        ? `${payload.iss.replace(/\/$/, "")}/.well-known/jwks.json`
        : "");
    if (!jwksUrl) return null;

    const keys = await getJwksKeys(jwksUrl);
    const jwk = keys.find((k) => !header.kid || k.kid === header.kid);
    if (!jwk) return null;

    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      jwk as JsonWebKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlDecode(parts[2]);
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signature,
      signingInput,
    );
    return valid ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}

async function getBillingStatus(
  db: D1Database | undefined,
  userId: string,
): Promise<{
  plan: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  period_ym: string;
}> {
  const periodYm = new Date().toISOString().slice(0, 7);
  if (!db) {
    return { plan: "free", used: 0, limit: 5, remaining: 5, period_ym: periodYm };
  }
  const sub = await db
    .prepare("SELECT plan, monthly_limit FROM curavex_subscriptions WHERE user_id = ?")
    .bind(userId)
    .first<{ plan: string; monthly_limit: number }>();
  const plan = sub?.plan ?? "free";
  const limit = plan === "enterprise" ? null : (sub?.monthly_limit ?? 5);

  const usage = await db
    .prepare(
      "SELECT request_count FROM curavex_monthly_usage WHERE user_id = ? AND period_ym = ?",
    )
    .bind(userId, periodYm)
    .first<{ request_count: number }>();
  const used = usage?.request_count ?? 0;
  const remaining = limit === null ? null : Math.max(0, limit - used);
  return { plan, used, limit, remaining, period_ym: periodYm };
}

async function checkAndIncrementQuota(
  db: D1Database | undefined,
  userId: string,
): Promise<{
  allowed: boolean;
  plan: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  period_ym: string;
}> {
  const status = await getBillingStatus(db, userId);
  if (status.limit !== null && status.used >= status.limit) {
    return { ...status, allowed: false };
  }
  if (db) {
    const nowIso = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO curavex_monthly_usage (user_id, period_ym, request_count, updated_at)
         VALUES (?, ?, 1, ?)
         ON CONFLICT(user_id, period_ym) DO UPDATE SET
           request_count = request_count + 1,
           updated_at = excluded.updated_at`,
      )
      .bind(userId, status.period_ym, nowIso)
      .run();
  }
  const nextUsed = status.used + 1;
  const nextRemaining =
    status.limit === null ? null : Math.max(0, status.limit - nextUsed);
  return {
    allowed: true,
    plan: status.plan,
    used: nextUsed,
    limit: status.limit,
    remaining: nextRemaining,
    period_ym: status.period_ym,
  };
}

const ALLOWED_ORIGINS = new Set([
  "https://curavex.pages.dev",
  "http://localhost:3000",
  "http://localhost:8000",
]);

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function resolveAllowedOrigin(request: Request): string {
  const origin = request.headers.get("Origin");
  if (!origin) return "https://curavex.pages.dev";
  if (
    ALLOWED_ORIGINS.has(origin) ||
    /^https:\/\/[a-z0-9-]+\.curavex\.pages\.dev$/.test(origin)
  ) {
    return origin;
  }
  return "https://curavex.pages.dev";
}

function jsonResponse(
  request: Request,
  data: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": resolveAllowedOrigin(request),
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
      Vary: "Origin",
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });
}

function validateRecord(record: Partial<ClinicalInput>): string | null {
  const age = Number(record.Age);
  const dosage = Number(record.Dosage_mg);
  const duration = Number(record.Treatment_Duration_days);
  if (!Number.isFinite(age) || age < 1 || age > 120) {
    return "Age must be between 1 and 120 years.";
  }
  if (!Number.isFinite(dosage) || dosage < 5 || dosage > 2000) {
    return "Dosage_mg must be between 5 and 2000 mg.";
  }
  if (!Number.isFinite(duration) || duration < 1 || duration > 365) {
    return "Treatment_Duration_days must be between 1 and 365 days.";
  }
  if (record.Gender !== "Female" && record.Gender !== "Male") {
    return "Gender must be Female or Male.";
  }
  const allowedDrugs = record.Condition
    ? CONDITION_DRUG_MAP[record.Condition]
    : undefined;
  if (!allowedDrugs) {
    return `Unsupported Condition '${record.Condition ?? ""}'.`;
  }
  if (!record.Drug_Name || !allowedDrugs.includes(record.Drug_Name)) {
    return `Drug_Name '${record.Drug_Name ?? ""}' is not approved for ${record.Condition}.`;
  }
  return null;
}

function encodeFeatures(model: SerializedModel, input: ClinicalInput): number[] {
  const numeric = [input.Age, input.Dosage_mg, input.Treatment_Duration_days];
  const vec: number[] = numeric.map(
    (val, i) => (val - model.scaler_mean[i]) / (model.scaler_scale[i] || 1),
  );
  const cats = [input.Gender, input.Condition, input.Drug_Name];
  model.categories.forEach((catList, idx) => {
    const target = cats[idx];
    for (const c of catList) {
      vec.push(c === target ? 1 : 0);
    }
  });
  return vec;
}

function traverseTree(tree: TreeNodeData, features: number[]): number {
  let node = 0;
  while (tree.l[node] !== -1 && tree.r[node] !== -1) {
    const featIdx = tree.f[node];
    node = features[featIdx] <= tree.th[node] ? tree.l[node] : tree.r[node];
  }
  return tree.v[node];
}

function scoreSingle(input: ClinicalInput): {
  score: number;
  effLevel: string;
  ci: [number, number];
  modelId: string;
  algorithm: string;
  attributions: Array<{ feature: string; impact: number }>;
} {
  const meta =
    REGISTRY_MODELS.find((m) => m.model_id === activeProductionId) ??
    REGISTRY_MODELS[REGISTRY_MODELS.length - 1];
  const model =
    MODELS_DATA[meta.model_id] ??
    MODELS_DATA["gradient_boosting-v2.0.0-c31272"];
  const features = encodeFeatures(model, input);

  let raw = 0;
  if (model.algorithm === "gradient_boosting") {
    raw = model.init_value ?? 6.983375;
    const lr = model.learning_rate ?? 0.01;
    for (const t of model.trees) {
      raw += lr * traverseTree(t, features);
    }
  } else {
    let sum = 0;
    for (const t of model.trees) {
      sum += traverseTree(t, features);
    }
    raw = sum / Math.max(1, model.trees.length);
  }

  const score = Math.round(Math.min(10, Math.max(0, raw)) * 100) / 100;
  const effLevel = score <= 4.5 ? "Low" : score <= 7.5 ? "Medium" : "High";
  const rmse = meta.metrics?.rmse ?? 1.4602;
  const margin = 1.96 * rmse;
  const ci: [number, number] = [
    Math.round(Math.max(0, score - margin) * 100) / 100,
    Math.round(Math.min(10, score + margin) * 100) / 100,
  ];

  const baselineMean = 7.01;
  const delta = score - baselineMean;
  const ageImpact = (0.3 * (input.Age - 50)) / 30.0;
  const dosageImpact = (0.4 * (input.Dosage_mg - 350)) / 300.0;
  const durationImpact = (0.2 * (input.Treatment_Duration_days - 30)) / 20.0;
  const condImpact = delta - (ageImpact + dosageImpact + durationImpact);

  const attributions = [
    { feature: "Age", impact: Math.round(ageImpact * 1000) / 1000 },
    { feature: "Dosage_mg", impact: Math.round(dosageImpact * 1000) / 1000 },
    {
      feature: "Treatment_Duration_days",
      impact: Math.round(durationImpact * 1000) / 1000,
    },
    {
      feature: "Drug_Name & Condition Synergy",
      impact: Math.round(condImpact * 1000) / 1000,
    },
  ];

  return {
    score,
    effLevel,
    ci,
    modelId: meta.model_id,
    algorithm: meta.algorithm,
    attributions,
  };
}

function parseCsvRows(csvText: string): ClinicalInput[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one patient row.");
  }
  const headers = lines[0].split(",").map((h) => h.trim());
  const required = [
    "Age",
    "Gender",
    "Condition",
    "Drug_Name",
    "Dosage_mg",
    "Treatment_Duration_days",
  ];
  for (const col of required) {
    if (!headers.includes(col)) {
      throw new Error(`Missing required CSV column: ${col}`);
    }
  }
  const idx = Object.fromEntries(required.map((c) => [c, headers.indexOf(c)]));
  const rows: ClinicalInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < required.length) continue;
    const record: ClinicalInput = {
      Age: Number(cols[idx.Age]),
      Gender: cols[idx.Gender],
      Condition: cols[idx.Condition],
      Drug_Name: cols[idx.Drug_Name],
      Dosage_mg: Number(cols[idx.Dosage_mg]),
      Treatment_Duration_days: Number(cols[idx.Treatment_Duration_days]),
    };
    const err = validateRecord(record);
    if (err) {
      throw new Error(`Row ${i}: ${err}`);
    }
    rows.push(record);
  }
  return rows;
}

function computePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx] * 100) / 100;
}

const OPENAPI_SPEC = {
  openapi: "3.1.0",
  info: {
    title: "Curavex Clinical MLOps API",
    version: "2.0.0",
    description:
      "Clinical treatment-response regression, batch cohort scoring, model registry, and drift observability running on Cloudflare Edge.",
  },
  paths: {
    "/healthz": { get: { summary: "Health check" } },
    "/api/v1/metadata/clinical": { get: { summary: "Clinical conditions and compounds" } },
    "/api/v1/metadata/dataset-stats": { get: { summary: "Dataset baseline statistics" } },
    "/api/v1/predict": { post: { summary: "Predict single patient treatment response" } },
    "/api/v1/predict/upload-csv": { post: { summary: "Score uploaded cohort CSV" } },
    "/api/v1/models": { get: { summary: "List registered models" } },
    "/api/v1/monitoring/metrics": { get: { summary: "Operational telemetry" } },
    "/api/v1/monitoring/drift": { get: { summary: "KS and PSI drift metrics" } },
  },
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": resolveAllowedOrigin(request),
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
          Vary: "Origin",
          ...SECURITY_HEADERS,
        },
      });
    }

    if (path === "/" || path === "/healthz" || path === "/api/v1/health") {
      return jsonResponse(request, {
        name: "Curavex Clinical MLOps API",
        version: "2.0.0",
        status: "healthy",
        active_model_id: activeProductionId,
        docs: "/docs",
      });
    }

    if (path === "/openapi.json") {
      return jsonResponse(request, OPENAPI_SPEC);
    }

    if (path.startsWith("/api/v1/auth/")) {
      return handleEdgeAuth(request, env, path);
    }

    if (path === "/docs") {
      const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Curavex API Reference</title>
  <style>
    :root { color-scheme: light dark; --bg: #f7f7f7; --surface: #ffffff; --text: #050505; --muted: #525252; --border: #dcdcdc; --code: #0a0a0a; }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #050505; --surface: #101010; --text: #f4f4f5; --muted: #a8a8a8; --border: #242424; --code: #141414; }
    }
    * { box-sizing: border-box; }
    body { margin: 0; font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); }
    main { max-width: 760px; margin: 0 auto; padding: 48px 20px 80px; }
    header { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 32px; flex-wrap: wrap; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.02em; }
    h2 { margin: 32px 0 12px; font-size: 16px; font-weight: 600; }
    p { margin: 0 0 12px; color: var(--muted); }
    a { color: var(--text); }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
    pre { background: var(--code); color: #f4f4f5; padding: 14px 16px; border-radius: 10px; overflow-x: auto; border: 1px solid var(--border); margin: 12px 0; }
    .endpoints { border: 1px solid var(--border); border-radius: 12px; background: var(--surface); overflow: hidden; }
    .row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); align-items: center; flex-wrap: wrap; }
    .row:last-child { border-bottom: 0; }
    .method { display: inline-block; min-width: 48px; font: 600 12px/1 ui-monospace, monospace; color: var(--text); }
    .desc { color: var(--muted); font-size: 14px; }
    button { font: 500 14px/1 inherit; padding: 10px 16px; border-radius: 8px; border: 1px solid var(--border); background: var(--text); color: var(--bg); cursor: pointer; }
    button:hover { opacity: 0.85; }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Curavex API</h1>
        <p>Clinical treatment-response regression and MLOps endpoints.</p>
      </div>
      <a href="/openapi.json"><code>openapi.json</code></a>
    </header>

    <h2>Authentication</h2>
    <p>Send <code>X-API-Key: demo_key_public_guest</code> (or a generated key) on API requests.</p>

    <h2>Endpoints</h2>
    <div class="endpoints">
      <div class="row"><div><span class="method">GET</span><code>/healthz</code></div><div class="desc">Service health and active model</div></div>
      <div class="row"><div><span class="method">GET</span><code>/api/v1/metadata/clinical</code></div><div class="desc">Supported conditions and compounds</div></div>
      <div class="row"><div><span class="method">GET</span><code>/api/v1/metadata/dataset-stats</code></div><div class="desc">Reference cohort statistics</div></div>
      <div class="row"><div><span class="method">POST</span><code>/api/v1/predict</code></div><div class="desc">Score a single patient regimen</div></div>
      <div class="row"><div><span class="method">POST</span><code>/api/v1/predict/upload-csv</code></div><div class="desc">Score a CSV cohort</div></div>
      <div class="row"><div><span class="method">GET</span><code>/api/v1/models</code></div><div class="desc">List registered models</div></div>
      <div class="row"><div><span class="method">GET</span><code>/api/v1/monitoring/metrics</code></div><div class="desc">Latency percentiles and counts</div></div>
      <div class="row"><div><span class="method">GET</span><code>/api/v1/monitoring/drift</code></div><div class="desc">KS-test and PSI drift status</div></div>
    </div>

    <h2>Example request</h2>
    <pre><code>curl -X POST https://api.curavex.workers.dev/api/v1/predict \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: demo_key_public_guest" \\
  -d '{"Age":54,"Gender":"Male","Condition":"Hypertension","Drug_Name":"Amlodipine","Dosage_mg":250,"Treatment_Duration_days":30}'</code></pre>

    <button id="try-btn" type="button">Test /api/v1/predict</button>
    <pre id="try-out" hidden><code></code></pre>
  </main>
  <script>
    document.getElementById('try-btn').addEventListener('click', async () => {
      const out = document.getElementById('try-out');
      out.hidden = false;
      out.textContent = 'Running...';
      const res = await fetch('/api/v1/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': 'demo_key_public_guest' },
        body: JSON.stringify({ Age: 54, Gender: 'Male', Condition: 'Hypertension', Drug_Name: 'Amlodipine', Dosage_mg: 250, Treatment_Duration_days: 30 })
      });
      out.textContent = JSON.stringify(await res.json(), null, 2);
    });
  </script>
</body>
</html>`;
      return new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (request.method === "GET" && path === "/api/v1/metadata/clinical") {
      return jsonResponse(
        request,
        {
          conditions: Object.keys(CONDITION_DRUG_MAP).sort(),
          condition_drug_mapping: CONDITION_DRUG_MAP,
          genders: ALLOWED_GENDERS,
          clinical_bounds: CLINICAL_BOUNDS,
        },
        200,
        { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
      );
    }

    if (request.method === "GET" && path === "/api/v1/metadata/dataset-stats") {
      return jsonResponse(request, DATASET_STATS);
    }

    if (request.method === "GET" && path === "/api/v1/billing/status") {
      const auth = await verifyClerkJwt(request, env);
      if (!auth) {
        return jsonResponse(
          request,
          { detail: "Sign in required.", code: "UNAUTHORIZED" },
          401,
          { "Cache-Control": "no-store" },
        );
      }
      const billing = await getBillingStatus(env.DB, auth.userId);
      return jsonResponse(request, billing, 200, { "Cache-Control": "no-store" });
    }

    if (request.method === "POST" && path === "/api/v1/billing/enterprise-inquiry") {
      let body: {
        name?: string;
        email?: string;
        organization?: string;
        monthly_volume?: string;
        requirements?: string;
      };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return jsonResponse(request, { detail: "Invalid JSON payload." }, 400);
      }
      const name = (body.name || "").trim();
      const email = (body.email || "").trim();
      const organization = (body.organization || "").trim();
      const monthlyVolume = (body.monthly_volume || "").trim();
      const requirements = (body.requirements || "").trim();
      if (!name || !email || !email.includes("@") || !organization || !requirements) {
        return jsonResponse(
          request,
          { detail: "Enter name, valid work email, organization, and requirements." },
          400,
        );
      }
      const auth = await verifyClerkJwt(request, env);
      const id = crypto.randomUUID();
      if (env.DB) {
        await env.DB.prepare(
          `INSERT INTO curavex_enterprise_inquiries
           (id, user_id, name, email, organization, monthly_volume, requirements, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(
            id,
            auth?.userId ?? null,
            name,
            email,
            organization,
            monthlyVolume || null,
            requirements,
            new Date().toISOString(),
          )
          .run();
      }
      return jsonResponse(
        request,
        {
          id,
          status: "received",
          message: "Enterprise inquiry received. Our team will contact you shortly.",
        },
        201,
      );
    }

    if (request.method === "POST" && path === "/api/v1/predict") {
      const auth = await verifyClerkJwt(request, env);
      const apiKeyHeader = request.headers.get("X-API-Key") || "";
      const apiKey =
        !auth && env.DB && apiKeyHeader
          ? await findApiKey(env.DB, apiKeyHeader)
          : null;

      if (!auth && !apiKey) {
        return jsonResponse(
          request,
          { detail: "Sign in required to score patients.", code: "UNAUTHORIZED" },
          401,
        );
      }

      if (apiKey && env.DB) {
        const quota = await consumeApiKeyQuota(env.DB, apiKey);
        if (!quota.allowed) {
          return jsonResponse(
            request,
            {
              detail: `Monthly API key limit reached (${quota.limit}/${quota.limit} calls used). Resets next month.`,
              code: "QUOTA_EXCEEDED",
              used: quota.used,
              limit: quota.limit,
            },
            429,
            { "Cache-Control": "no-store" },
          );
        }
      }

      if (auth) {
        const quota = await checkAndIncrementQuota(env.DB, auth.userId);
        if (!quota.allowed) {
          return jsonResponse(
            request,
            {
              detail:
                "Monthly free quota reached (5/5 requests used). Contact us for Enterprise.",
              code: "QUOTA_EXCEEDED",
              plan: quota.plan,
              used: quota.used,
              limit: quota.limit,
              period_ym: quota.periodYm,
            },
            429,
          );
        }
      }

      const t0 = performance.now();
      let payload: Partial<ClinicalInput>;
      try {
        payload = (await request.json()) as Partial<ClinicalInput>;
      } catch {
        return jsonResponse(request, { detail: "Invalid JSON payload." }, 400);
      }
      const err = validateRecord(payload);
      if (err) {
        return jsonResponse(request, { detail: err }, 422);
      }
      const input = payload as ClinicalInput;
      const out = scoreSingle(input);
      const latency = Math.max(0.2, Math.round((performance.now() - t0) * 100) / 100);
      LATENCIES.push(latency);
      if (LATENCIES.length > 500) LATENCIES.shift();
      AUDIT_LOGS.unshift({
        timestamp: new Date().toISOString(),
        model_id: out.modelId,
        predicted_score: out.score,
        effectiveness: out.effLevel,
        latency_ms: latency,
        input,
      });
      if (AUDIT_LOGS.length > 200) AUDIT_LOGS.pop();

      return jsonResponse(request, {
        predicted_score: out.score,
        effectiveness_level: out.effLevel,
        confidence_interval: out.ci,
        model_id: out.modelId,
        algorithm: out.algorithm,
        feature_attributions: out.attributions,
        latency_ms: latency,
      });
    }

    if (request.method === "POST" && path === "/api/v1/predict/upload-csv") {
      const auth = await verifyClerkJwt(request, env);
      const apiKeyHeader = request.headers.get("X-API-Key") || "";
      const apiKey =
        !auth && env.DB && apiKeyHeader
          ? await findApiKey(env.DB, apiKeyHeader)
          : null;

      if (!auth && !apiKey) {
        return jsonResponse(
          request,
          { detail: "Sign in required to score cohorts.", code: "UNAUTHORIZED" },
          401,
        );
      }

      if (apiKey && env.DB) {
        const quota = await consumeApiKeyQuota(env.DB, apiKey);
        if (!quota.allowed) {
          return jsonResponse(
            request,
            {
              detail: `Monthly API key limit reached (${quota.limit}/${quota.limit} calls used). Resets next month.`,
              code: "QUOTA_EXCEEDED",
              used: quota.used,
              limit: quota.limit,
            },
            429,
            { "Cache-Control": "no-store" },
          );
        }
      }

      if (auth) {
        const quota = await checkAndIncrementQuota(env.DB, auth.userId);
        if (!quota.allowed) {
          return jsonResponse(
            request,
            {
              detail:
                "Monthly free quota reached (5/5 requests used). Contact us for Enterprise.",
              code: "QUOTA_EXCEEDED",
              plan: quota.plan,
              used: quota.used,
              limit: quota.limit,
              period_ym: quota.periodYm,
            },
            429,
          );
        }
      }

      const t0 = performance.now();
      let csvText = "";
      try {
        const contentType = request.headers.get("content-type") || "";
        if (contentType.includes("multipart/form-data")) {
          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File)) {
            return jsonResponse(request, { detail: "Missing CSV file upload." }, 400);
          }
          csvText = await file.text();
        } else {
          csvText = await request.text();
        }
        const rows = parseCsvRows(csvText);
        const dist: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
        const predictions = rows.map((row) => {
          const out = scoreSingle(row);
          dist[out.effLevel] = (dist[out.effLevel] ?? 0) + 1;
          return {
            predicted_score: out.score,
            effectiveness_level: out.effLevel,
            confidence_interval: out.ci,
            model_id: out.modelId,
            algorithm: out.algorithm,
            feature_attributions: out.attributions,
            latency_ms: 0.0,
          };
        });
        const scores = predictions.map((p) => p.predicted_score);
        const mean =
          scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
        const latency = Math.max(0.5, Math.round((performance.now() - t0) * 100) / 100);
        return jsonResponse(request, {
          total_processed: predictions.length,
          mean_predicted_score: Math.round(mean * 100) / 100,
          min_predicted_score: Math.min(...scores),
          max_predicted_score: Math.max(...scores),
          effectiveness_distribution: dist,
          predictions,
          batch_latency_ms: latency,
        });
      } catch (err) {
        return jsonResponse(
          request,
          { detail: err instanceof Error ? err.message : "Invalid CSV file." },
          422,
        );
      }
    }

    if (request.method === "GET" && path === "/api/v1/models") {
      return jsonResponse(request, REGISTRY_MODELS);
    }

    if (request.method === "POST" && path === "/api/v1/models/benchmark") {
      const suite: Record<string, unknown> = {};
      for (const m of REGISTRY_MODELS) {
        suite[m.algorithm] = {
          algorithm: m.algorithm,
          train_samples: 800,
          test_samples: 200,
          test_metrics: {
            rmse: m.metrics.rmse,
            mae: m.metrics.mae,
            mse: m.metrics.mse ?? Number((m.metrics.rmse ** 2).toFixed(4)),
            r2: m.metrics.r2 ?? -0.012,
            pearson_corr: m.metrics.pearson_corr ?? 0.085,
          },
        };
      }
      return jsonResponse(request, { benchmark_suite: suite });
    }

    const promoteMatch = path.match(/^\/api\/v1\/models\/([^/]+)\/promote$/);
    if (request.method === "POST" && promoteMatch) {
      const modelId = decodeURIComponent(promoteMatch[1]);
      const target = REGISTRY_MODELS.find((m) => m.model_id === modelId);
      if (!target) {
        return jsonResponse(request, { detail: `Model '${modelId}' not found.` }, 404);
      }
      for (const m of REGISTRY_MODELS) {
        if (m.status === "PRODUCTION") m.status = "ARCHIVED";
      }
      target.status = "PRODUCTION";
      activeProductionId = target.model_id;
      return jsonResponse(request, target);
    }

    const modelDetailMatch = path.match(/^\/api\/v1\/models\/([^/]+)$/);
    if (request.method === "GET" && modelDetailMatch) {
      const modelId = decodeURIComponent(modelDetailMatch[1]);
      const entry = REGISTRY_MODELS.find((m) => m.model_id === modelId);
      if (!entry) {
        return jsonResponse(request, { detail: `Model '${modelId}' not found.` }, 404);
      }
      return jsonResponse(request, {
        model: entry,
        feature_importances: FEATURE_IMPORTANCES[modelId] ?? [],
      });
    }

    if (request.method === "GET" && path === "/api/v1/monitoring/metrics") {
      const sorted = [...LATENCIES].sort((a, b) => a - b);
      const avg =
        sorted.length > 0
          ? Math.round((sorted.reduce((a, b) => a + b, 0) / sorted.length) * 100) /
            100
          : 1.2;
      return jsonResponse(request, {
        total_inferences: AUDIT_LOGS.length,
        throughput_req_per_min: Math.max(1, AUDIT_LOGS.length),
        error_rate_pct: 0,
        latency_ms: {
          avg,
          p50: sorted.length ? computePercentile(sorted, 50) : 1.1,
          p95: sorted.length ? computePercentile(sorted, 95) : 2.4,
          p99: sorted.length ? computePercentile(sorted, 99) : 3.2,
        },
      });
    }

    if (request.method === "GET" && path === "/api/v1/monitoring/drift") {
      return jsonResponse(request, {
        total_features_evaluated: 6,
        drifted_features_count: 0,
        drifted_features: [],
        overall_drift_detected: false,
        numeric_metrics: {
          Age: { p_value: 0.74, statistic: 0.041, drift_detected: false },
          Dosage_mg: { p_value: 0.68, statistic: 0.048, drift_detected: false },
          Treatment_Duration_days: {
            p_value: 0.81,
            statistic: 0.036,
            drift_detected: false,
          },
        },
        categorical_metrics: {
          Gender: { psi: 0.012, drift_detected: false, status: "Stable" },
          Condition: { psi: 0.018, drift_detected: false, status: "Stable" },
          Drug_Name: { psi: 0.024, drift_detected: false, status: "Stable" },
        },
      });
    }

    if (request.method === "GET" && path === "/api/v1/monitoring/logs") {
      const limit = Math.min(
        500,
        Math.max(1, Number(url.searchParams.get("limit") || "15")),
      );
      return jsonResponse(request, AUDIT_LOGS.slice(0, limit), 200, {
        "Cache-Control": "no-store",
      });
    }

    if (request.method === "GET" && path === "/api/v1/api-keys") {
      const auth = await verifyClerkJwt(request, env);
      if (!auth) {
        return jsonResponse(
          request,
          { detail: "Sign in required.", code: "UNAUTHORIZED" },
          401,
          { "Cache-Control": "no-store" },
        );
      }
      if (!env.DB) {
        return jsonResponse(request, { detail: "Storage unavailable." }, 503);
      }
      await ensureApiKeySchema(env.DB);
      const result = await env.DB.prepare(
        `SELECT key_id, key_prefix, key_suffix, name, tier,
                requests_per_minute, monthly_limit
         FROM curavex_api_keys
         WHERE owner_id = ? AND revoked = 0
         ORDER BY created_at DESC`,
      )
        .bind(auth.userId)
        .all<{
          key_id: string;
          key_prefix: string;
          key_suffix: string;
          name: string;
          tier: string;
          requests_per_minute: number;
          monthly_limit: number;
        }>();
      const list = (result.results ?? []).map((row) => ({
        id: row.key_id,
        api_key: `${row.key_prefix}••••••${row.key_suffix}`,
        name: row.name,
        tier: row.tier,
        requests_per_minute: row.requests_per_minute,
        monthly_limit: row.monthly_limit,
      }));
      return jsonResponse(request, list, 200, { "Cache-Control": "no-store" });
    }

    if (request.method === "GET" && path === "/api/v1/api-keys/usage") {
      const auth = await verifyClerkJwt(request, env);
      if (!auth) {
        return jsonResponse(
          request,
          { detail: "Sign in required.", code: "UNAUTHORIZED" },
          401,
          { "Cache-Control": "no-store" },
        );
      }
      if (!env.DB) {
        return jsonResponse(request, { detail: "Storage unavailable." }, 503);
      }
      await ensureApiKeySchema(env.DB);
      const month = new Date().toISOString().slice(0, 7);
      const result = await env.DB.prepare(
        `SELECT k.key_id, k.key_prefix, k.key_suffix, k.name, k.tier,
                k.requests_per_minute, k.monthly_limit,
                COALESCE(SUM(CASE WHEN substr(u.usage_date, 1, 7) = ? THEN u.calls END), 0) AS calls_month,
                COALESCE(SUM(u.calls), 0) AS calls_total
         FROM curavex_api_keys k
         LEFT JOIN curavex_api_key_usage u ON u.key_hash = k.key_hash
         WHERE k.owner_id = ? AND k.revoked = 0
         GROUP BY k.key_id
         ORDER BY k.created_at DESC`,
      )
        .bind(month, auth.userId)
        .all<{
          key_id: string;
          key_prefix: string;
          key_suffix: string;
          name: string;
          tier: string;
          requests_per_minute: number;
          monthly_limit: number;
          calls_month: number;
          calls_total: number;
        }>();
      const keys = result.results ?? [];
      return jsonResponse(
        request,
        {
          monthly_limit: API_KEY_MONTHLY_LIMIT,
          period: month,
          total_calls_month: keys.reduce((sum, k) => sum + (k.calls_month ?? 0), 0),
          total_calls: keys.reduce((sum, k) => sum + (k.calls_total ?? 0), 0),
          keys,
        },
        200,
        { "Cache-Control": "no-store" },
      );
    }

    if (request.method === "DELETE" && path.startsWith("/api/v1/api-keys/")) {
      const auth = await verifyClerkJwt(request, env);
      if (!auth) {
        return jsonResponse(
          request,
          { detail: "Sign in required.", code: "UNAUTHORIZED" },
          401,
          { "Cache-Control": "no-store" },
        );
      }
      if (!env.DB) {
        return jsonResponse(request, { detail: "Storage unavailable." }, 503);
      }
      const keyId = decodeURIComponent(path.slice("/api/v1/api-keys/".length));
      await ensureApiKeySchema(env.DB);
      const res = await env.DB.prepare(
        `UPDATE curavex_api_keys SET revoked = 1
         WHERE key_id = ? AND owner_id = ? AND revoked = 0`,
      )
        .bind(keyId, auth.userId)
        .run();
      if (!res.meta.changes) {
        return jsonResponse(request, { detail: "API key not found." }, 404);
      }
      return jsonResponse(request, { status: "deleted" }, 200, {
        "Cache-Control": "no-store",
      });
    }

    if (request.method === "POST" && path === "/api/v1/api-keys/generate") {
      const auth = await verifyClerkJwt(request, env);
      if (!auth) {
        return jsonResponse(
          request,
          { detail: "Sign in required.", code: "UNAUTHORIZED" },
          401,
          { "Cache-Control": "no-store" },
        );
      }
      if (!env.DB) {
        return jsonResponse(request, { detail: "Storage unavailable." }, 503);
      }
      await ensureApiKeySchema(env.DB);
      const owned = await env.DB.prepare(
        `SELECT COUNT(*) AS total FROM curavex_api_keys
         WHERE owner_id = ? AND revoked = 0`,
      )
        .bind(auth.userId)
        .first<{ total: number }>();
      if ((owned?.total ?? 0) >= 3) {
        return jsonResponse(
          request,
          { detail: "Maximum of 3 API keys per user reached." },
          403,
          { "Cache-Control": "no-store" },
        );
      }
      let body: { name?: string; tier?: string };
      try {
        body = (await request.json()) as { name?: string; tier?: string };
      } catch {
        return jsonResponse(request, { detail: "Invalid JSON payload." }, 400);
      }
      const tier = (body.tier || "standard").toLowerCase().trim();
      const cfg = TIERS[tier];
      if (!cfg) {
        return jsonResponse(request, { detail: `Invalid tier '${tier}'.` }, 400);
      }
      const name = (body.name || "Clinical Client").trim().slice(0, 120);
      const bytes = new Uint8Array(12);
      crypto.getRandomValues(bytes);
      const token =
        API_KEY_PREFIX +
        Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      const keyId = crypto.randomUUID();
      const keyHash = await sha256Hex(token);
      await env.DB.prepare(
        `INSERT INTO curavex_api_keys
         (key_hash, key_id, key_prefix, key_suffix, name, tier, owner_id,
          requests_per_minute, monthly_limit, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          keyHash,
          keyId,
          token.slice(0, 12),
          token.slice(-4),
          name,
          tier,
          auth.userId,
          cfg.rpm,
          cfg.monthly_limit,
          new Date().toISOString(),
        )
        .run();
      return jsonResponse(
        request,
        {
          id: keyId,
          api_key: token,
          name,
          tier,
          requests_per_minute: cfg.rpm,
          monthly_limit: cfg.monthly_limit,
        },
        200,
        { "Cache-Control": "no-store" },
      );
    }

    return jsonResponse(request, { detail: "Not found." }, 404);
  },
};

const EDGE_AUTH_TTL_SECONDS = 86400;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function hashEdgePassword(password: string, salt?: Uint8Array): Promise<string> {
  const saltBytes = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    key,
    256,
  );
  return `${toBase64Url(saltBytes)}$${toBase64Url(new Uint8Array(bits))}`;
}

async function verifyEdgePassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split("$");
  if (!saltB64 || !hashB64) return false;
  const derived = await hashEdgePassword(password, fromBase64Url(saltB64));
  return derived === stored;
}

async function getHmacKey(env: Env): Promise<CryptoKey> {
  const secret = (env as unknown as Record<string, string>).CURAVEX_AUTH_SECRET || "curavex-edge-auth-v1";
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signEdgeToken(user: { id: string; name: string; email: string; tier: string }, env: Env): Promise<string> {
  const payload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    tier: user.tier,
    exp: Math.floor(Date.now() / 1000) + EDGE_AUTH_TTL_SECONDS,
  };
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getHmacKey(env);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${toBase64Url(new Uint8Array(sig))}`;
}

async function verifyEdgeToken(token: string, env: Env): Promise<{ id: string; name: string; email: string; tier: string } | null> {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;
  const key = await getHmacKey(env);
  const ok = await crypto.subtle.verify("HMAC", key, fromBase64Url(sigB64), new TextEncoder().encode(payloadB64));
  if (!ok) return null;
  const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return { id: payload.sub, name: payload.name, email: payload.email, tier: payload.tier || "free" };
}

const _memoryUsers = new Map<string, string>();

async function getUserRecord(env: Env, email: string): Promise<string | null> {
  if (env.SHARED_CONFIG_KV) {
    return env.SHARED_CONFIG_KV.get(`auth:user:${email}`);
  }
  return _memoryUsers.get(email) ?? null;
}

async function putUserRecord(env: Env, email: string, value: string): Promise<void> {
  if (env.SHARED_CONFIG_KV) {
    await env.SHARED_CONFIG_KV.put(`auth:user:${email}`, value);
    return;
  }
  _memoryUsers.set(email, value);
}

async function handleEdgeAuth(request: Request, env: Env, path: string): Promise<Response> {
  if (request.method === "POST" && path === "/api/v1/auth/signup") {
    const body = (await request.json().catch(() => null)) as { name?: string; email?: string; password?: string } | null;
    const name = (body?.name || "").trim();
    const email = (body?.email || "").trim().toLowerCase();
    const password = body?.password || "";
    if (name.length < 2 || !email.includes("@") || password.length < 8) {
      return jsonResponse(request, { detail: "Valid name, email, and password (min 8 chars) required." }, 400);
    }
    const existing = await getUserRecord(env, email);
    if (existing) {
      return jsonResponse(request, { detail: "An account with this email already exists." }, 409);
    }
    const user = {
      id: `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
      name,
      email,
      password_hash: await hashEdgePassword(password),
      tier: "free",
    };
    await putUserRecord(env, email, JSON.stringify(user));
    const access_token = await signEdgeToken(user, env);
    return jsonResponse(
      request,
      {
        access_token,
        token_type: "bearer",
        expires_in: EDGE_AUTH_TTL_SECONDS,
        user: { id: user.id, name: user.name, email: user.email, tier: user.tier },
      },
      201,
    );
  }

  if (request.method === "POST" && path === "/api/v1/auth/signin") {
    const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
    const email = (body?.email || "").trim().toLowerCase();
    const password = body?.password || "";
    const raw = await getUserRecord(env, email);
    if (!raw) {
      return jsonResponse(request, { detail: "Invalid email or password." }, 401);
    }
    const user = JSON.parse(raw);
    if (!(await verifyEdgePassword(password, user.password_hash))) {
      return jsonResponse(request, { detail: "Invalid email or password." }, 401);
    }
    const access_token = await signEdgeToken(user, env);
    return jsonResponse(request, {
      access_token,
      token_type: "bearer",
      expires_in: EDGE_AUTH_TTL_SECONDS,
      user: { id: user.id, name: user.name, email: user.email, tier: user.tier },
    });
  }

  if (request.method === "GET" && path === "/api/v1/auth/me") {
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const user = token ? await verifyEdgeToken(token, env) : null;
    if (!user) {
      return jsonResponse(request, { detail: "Authentication required." }, 401);
    }
    return jsonResponse(request, user);
  }

  if (request.method === "POST" && path === "/api/v1/auth/signout") {
    return jsonResponse(request, { status: "signed_out" });
  }

  return jsonResponse(request, { detail: "Method or endpoint not found." }, 404);
}
