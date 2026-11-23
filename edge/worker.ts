export interface Env {
  AI: any;
  DB: D1Database;
  SHARED_CONFIG_KV: KVNamespace;
  UPSTREAM_API: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }

    // Free edge AI inference
    if (url.pathname === "/v1/edge-ai") {
      const result = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
        prompt: "Analyze clinical molecular binding affinity metrics."
      });
      return Response.json(result);
    }

    // Healthcheck probe at edge
    if (url.pathname === "/healthz") {
      return new Response("OK", { status: 200 });
    }

    // Proxy requests to backend API
    const targetBase = env.UPSTREAM_API || "https://curavex.vercel.app";
    const upstream = new URL(url.pathname + url.search, targetBase);
    const upstreamHeaders = new Headers(request.headers);
    upstreamHeaders.delete("host");

    const response = await fetch(upstream.toString(), {
      method: request.method,
      headers: upstreamHeaders,
      body: request.body
    });

    const respHeaders = new Headers(response.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    respHeaders.set("Access-Control-Allow-Headers", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders
    });
  }
};
