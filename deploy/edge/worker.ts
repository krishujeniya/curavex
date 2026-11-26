export interface Env {
  AI: any;
  DB: D1Database;
  SHARED_CONFIG_KV: KVNamespace;
  UPSTREAM_API: string;
}

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const CACHEABLE_READ_PATHS = new Set([
  "/api/v1/metadata/clinical",
  "/api/v1/models",
  "/api/v1/monitoring/metrics",
  "/api/v1/monitoring/drift",
]);

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/healthz") {
      return new Response(
        JSON.stringify({ status: "healthy", service: "curavex-backend-edge" }),
        { status: 200, headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      );
    }

    if (url.pathname === "/v1/edge-ai") {
      const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
        prompt: "Analyze clinical molecular binding affinity metrics.",
      });
      return Response.json(result, { headers: CORS_HEADERS });
    }

    const cache = caches.default;

    // 1. Edge-cache read-only metadata, model registry, and monitoring endpoints
    if (request.method === "GET" && CACHEABLE_READ_PATHS.has(url.pathname)) {
      const cacheKey = new Request(url.toString(), { method: "GET" });
      const cached = await cache.match(cacheKey);
      if (cached) {
        return withCors(cached);
      }
    }

    // 2. Edge-cache deterministic single predictions by SHA-256 of request body
    let bodyText: string | null = null;
    let predictCacheKey: Request | null = null;
    if (request.method === "POST" && url.pathname === "/api/v1/predict") {
      bodyText = await request.text();
      const hash = await sha256Hex(bodyText);
      predictCacheKey = new Request(`https://cache.curavex.internal/predict/${hash}`, {
        method: "GET",
      });
      const cachedPrediction = await cache.match(predictCacheKey);
      if (cachedPrediction) {
        return withCors(cachedPrediction);
      }
    }

    // 3. Forward to origin with bounded timeout and circuit-breaker fallback
    const targetBase = env.UPSTREAM_API || "https://curavex.vercel.app";
    const upstream = new URL(url.pathname + url.search, targetBase);
    const upstreamHeaders = new Headers(request.headers);
    upstreamHeaders.delete("host");

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(upstream.toString(), {
        method: request.method,
        headers: upstreamHeaders,
        body: bodyText !== null ? bodyText : request.body,
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      return new Response(
        JSON.stringify({
          detail: "Upstream inference gateway timed out or is temporarily unavailable.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        }
      );
    }

    const responseWithCors = withCors(upstreamResponse);

    // Populate Cloudflare Edge Cache asynchronously via ctx.waitUntil
    if (upstreamResponse.ok) {
      if (request.method === "GET" && CACHEABLE_READ_PATHS.has(url.pathname)) {
        const toCache = responseWithCors.clone();
        const headers = new Headers(toCache.headers);
        headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
        const cacheKey = new Request(url.toString(), { method: "GET" });
        ctx.waitUntil(
          cache.put(cacheKey, new Response(toCache.body, { status: toCache.status, headers }))
        );
      } else if (predictCacheKey) {
        const toCache = responseWithCors.clone();
        const headers = new Headers(toCache.headers);
        headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
        ctx.waitUntil(
          cache.put(predictCacheKey, new Response(toCache.body, { status: toCache.status, headers }))
        );
      }
    }

    return responseWithCors;
  },
};
