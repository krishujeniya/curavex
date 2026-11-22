export interface Env {
  AI: any;
  DB: D1Database;
  SHARED_CONFIG_KV: KVNamespace;
  UPSTREAM_API: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

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

    // Proxy other requests to Vercel production API
    const upstream = new URL(url.pathname + url.search, env.UPSTREAM_API);
    return fetch(upstream.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }
};
