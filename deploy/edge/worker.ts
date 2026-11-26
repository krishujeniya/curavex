export interface Env {
  AI: any;
  DB: D1Database;
  SHARED_CONFIG_KV: KVNamespace;
  UPSTREAM_API: string;
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

const CACHEABLE_READ_PATHS = new Set(["/api/v1/metadata/clinical"]);
const NO_STORE_PREFIXES = ["/api/v1/api-keys", "/api/v1/monitoring/logs"];

function resolveAllowedOrigin(request: Request): string {
  const origin = request.headers.get("Origin");
  if (!origin) return "https://curavex.pages.dev";
  if (ALLOWED_ORIGINS.has(origin) || /^https:\/\/[a-z0-9-]+\.curavex\.pages\.dev$/.test(origin)) {
    return origin;
  }
  return "https://curavex.pages.dev";
}

function withSecurityAndCors(request: Request, response: Response, pathname: string): Response {
  const headers = new Headers(response.headers);
  headers.delete("Server");
  headers.delete("X-Powered-By");

  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v);
  }

  headers.set("Access-Control-Allow-Origin", resolveAllowedOrigin(request));
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");
  headers.set("Vary", "Origin");

  if (NO_STORE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    headers.set("Cache-Control", "no-store");
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
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": resolveAllowedOrigin(request),
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization",
          "Vary": "Origin",
          ...SECURITY_HEADERS,
        },
      });
    }

    if (url.pathname === "/api/debug") {
      return new Response(JSON.stringify({ detail: "Not found." }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
      });
    }

    if (url.pathname === "/healthz") {
      return new Response(
        JSON.stringify({ status: "healthy" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": resolveAllowedOrigin(request),
            ...SECURITY_HEADERS,
          },
        }
      );
    }

    const cache = caches.default;

    // 1. Edge-cache strictly public clinical metadata
    if (request.method === "GET" && CACHEABLE_READ_PATHS.has(url.pathname)) {
      const cacheKey = new Request(url.toString(), { method: "GET" });
      const cached = await cache.match(cacheKey);
      if (cached) {
        return withSecurityAndCors(request, cached, url.pathname);
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
        return withSecurityAndCors(request, cachedPrediction, url.pathname);
      }
    }

    // 3. Forward to origin with bounded timeout and generic 503 fallback
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
        JSON.stringify({ detail: "Service temporarily unavailable." }),
        {
          status: 503,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": resolveAllowedOrigin(request),
            ...SECURITY_HEADERS,
          },
        }
      );
    }

    const secured = withSecurityAndCors(request, upstreamResponse, url.pathname);

    if (upstreamResponse.ok) {
      if (request.method === "GET" && CACHEABLE_READ_PATHS.has(url.pathname)) {
        const toCache = secured.clone();
        const headers = new Headers(toCache.headers);
        headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
        const cacheKey = new Request(url.toString(), { method: "GET" });
        ctx.waitUntil(
          cache.put(cacheKey, new Response(toCache.body, { status: toCache.status, headers }))
        );
      } else if (predictCacheKey) {
        const toCache = secured.clone();
        const headers = new Headers(toCache.headers);
        headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
        ctx.waitUntil(
          cache.put(predictCacheKey, new Response(toCache.body, { status: toCache.status, headers }))
        );
      }
    }

    return secured;
  },
};
