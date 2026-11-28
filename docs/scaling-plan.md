# Curavex Free-Tier Maximization & Scale Plan

Goal: extract maximum capability from Cloudflare's $0 tier while preserving
security, usability, and availability — and define the upgrade path to
million-user scale.

## 1. Hard constraints (verified against Cloudflare docs, Nov 2026)

| Resource | Free limit | Binding constraint? |
|---|---|---|
| Workers requests | 100,000/day (all scripts, resets 00:00 UTC) | **Yes — primary** |
| Workers CPU | 10 ms CPU/invocation | No (scoring is sub-ms) |
| Workers static assets | Unlimited, free, no Worker invocation | Exploit fully |
| Pages static hosting | Unlimited | Already optimal |
| D1 rows read | 5M/day | No |
| D1 rows written | 100k/day | **Yes — ties to request cap** |
| D1 size | 500 MB/db, 10 DBs, 7-day Time Travel | Fine now |
| D1 queries/invocation | 50 (Free) | Keep ≤3/request |
| KV | 100k reads, **1k writes**/day | Useless for counters |
| Durable Objects | 100k req/day, SQLite backend only | Same daily cap as Workers |
| Queues | 10k ops/day | Negligible |
| WAF custom rules | 5 (no regex) | Enough |
| Rate limiting | 1 rule, per-IP, 10s window, 10s block | Protect `/predict` |
| Cache Rules | 10 | Extend edge caching |

**Free-tier ceiling: ~100k Worker invocations/day ≈ 50–80k authenticated
predicts/day** after auth/metadata overhead. Frontend + static assets are
unbounded.

## 2. Architecture principle: "meter only what must be metered"

Every request that does NOT need per-request compute should be served as a
static asset or absorbed by edge cache. Worker invocations are the scarcest
resource — spend them only on authenticated predicts and key management.

### Phase A — Zero-cost wins (implement first)

1. **Move static JSON into Workers Static Assets**
   - `models_data.json`, `dataset_stats.json`, `feature_importances.json`,
     `registry.json`, OpenAPI spec → served as assets, not Worker responses.
   - Config: `assets.directory` + default routing (`run_worker_first = false`).
   - Requests to assets are free & unlimited — removes ~30–50% of Worker
     invocations from metadata/models/drift/docs traffic.
   - Keep `env.ASSETS.fetch()` fallback inside Worker for `/api/v1/*` paths
     that need JSON wrapping, or restructure endpoints to point at asset URLs.

2. **Aggressive edge caching on all public GETs** (already partially done)
   - `metadata/*`, `models`, `drift`, `openapi.json`: `s-maxage` +
     `stale-while-revalidate` (done in commit 5e5318b — extend to `/docs`).
   - Add **Cache Rules** (10 free) for `api.curavex.workers.dev/api/v1/metadata/*`
     etc. if Workers-side headers prove insufficient.

3. **Rate limiting** — DONE via Workers Rate Limiting binding (GA, free plan):
   three bindings `RL_FREE`/`RL_STANDARD`/`RL_ENTERPRISE` (60/300/1200 req
   per 60s) enforced per API-key-hash or per user on both predict endpoints.
   NOTE: dashboard WAF/rate-limit rules do NOT apply — `workers.dev`
   subdomains are not zones. Zone rules only become relevant if a custom
   domain is added later.

4. **WAF custom rules (5 free)**
   - Block known-bad ASNs/user-agents on `/api/v1/*` if attack surface grows.
   - Optional: challenge non-browser user-agents on predict (curl users keep
     working — challenge only on browser-like UAs is risky; prefer logging first).

### Phase B — Hot-path efficiency (extend free runway)

5. **Quota counter consolidation**
   - Current: session quota = 1 batch read + 1 upsert; API-key quota =
     lookup + SUM read + upsert ≈ 3 D1 ops/request.
   - Optimize: single `INSERT ... ON CONFLICT` with `RETURNING`-style check —
     or accept the read-then-write race (bounded overshoot ≤ concurrency).
   - At 100k req/day the D1 write cap (100k rows/day) binds *simultaneously*
     with the request cap — they are aligned; no separate fix needed on free.

6. **In-memory per-isolate caches** (already have JWKS cache)
   - Add tiny TTL cache for `findApiKey` results (60s) → repeat calls with the
     same key skip the D1 lookup. Trade-off: revoked keys stay valid ≤60s —
     acceptable for a 10-calls/month tier; document it.
   - Cache `ensureApiKeySchema` flag (already done via `apiKeySchemaReady`).

7. **Fail-open quota** (done) + **fail-closed auth lookup** (done) — keep.

8. **Request coalescing / early rejects**
   - Reject oversized bodies before `request.json()` (add `Content-Length`
     check, e.g. >256KB → 413) — prevents memory pressure under burst.
   - Validate JSON shape cheaply before DB work where possible.

### Phase C — Availability & CIA triad hardening

**Confidentiality**
- API keys: SHA-256 at rest (done), one-time reveal (done), prefix+suffix
  display only (done), TLS-only via Cloudflare edge (automatic).
- Add `Permissions-Policy`, keep CSP tight (done — exact origins only).
- Consider hashing session tokens the same way if edge auth expands.
- No PII in logs: current `console.warn` logs error objects only — keep it
  that way; never log request bodies (clinical data).

**Integrity**
- Quota counters: `ON CONFLICT DO UPDATE` upserts are atomic per row — good.
- Known race: concurrent requests can overshoot monthly quota by up to the
  in-flight count. On free tier this is bounded by the 100k/day cap and the
  10/month product limit — acceptable; fix properly with DO on paid.
- Add response `X-Request-Id` + structured `console.log` JSON for auditability.

**Availability**
- Fail-open quota on D1 errors (done) — predicts keep working during DB
  incidents; auth lookups fail closed (correct — never leak access).
- Static assets survive Worker outages? No — same Worker serves them; but
  Pages frontend (`curavex.pages.dev`) is fully independent of the API worker.
- Health endpoint exists (`/healthz`) — add it to an external uptime check
  (free tier: UptimeRobot/BetterStack free tier, or Cloudflare Health Checks
  on paid).
- Graceful degradation: if D1 down, metadata/models still served from
  bundled constants (already true — they're compile-time imports).

### Phase D — Free-tier ceiling management

9. **Usage visibility**
   - Cloudflare dashboard → Workers analytics shows daily request count vs
     100k. Add a `/api/v1/usage` admin endpoint reading GraphQL Analytics
     (optional; dashboard is enough at this scale).
   - Alert at ~80k/day via a free uptime/monitoring tool polling a counter.

10. **What NOT to do on free**
    - No KV counters (1k writes/day), no Queues pipelines (10k ops/day),
      no DO hot-path (same 100k req/day cap + complexity), no multi-account
      sharding (ToS violation).

## 3. Upgrade path (when free ceiling is hit)

Trigger: sustained >80k Worker req/day or D1 write throttling.

**Workers Paid ($5/mo minimum)** unlocks:
- 10M req/month included (+$0.30/M) — ~100× free
- D1: 25B reads / 50M writes per month — counters stop mattering
- Durable Objects → per-user atomic quota counters (kills the race),
  WebSocket-ready for future realtime features
- D1 read replicas for billing reads; 50 queries/invocation → 1000
- Queues → buffer usage writes, batch into D1 (100 rows/write) — decouples
  predict latency from DB write throughput entirely

**Target architecture at paid tier:**
```
Client → Pages (static, unlimited)
       → Worker: auth (JWKS cache) → DO quota check (~1ms) → scoreSingle
       → Queue.send(usage event) → consumer batches → D1
       → Static assets for all metadata/models/docs
```
Predict path D1 ops drop to ~0 on the hot path.

**True 1M-concurrent-user scale** additionally needs: read replicas,
per-tenant D1 sharding (D1 is designed for this — 100k DBs on paid),
and possibly a second region strategy. This is an engineering project,
not a config change — revisit when revenue/traffic justifies it.

## 4. Implementation order (when approved)

1. Static assets migration for JSON/docs (biggest free-tier win)
2. Cache Rules + `/docs` caching
3. 1 free rate-limit rule on `/predict`
4. API-key lookup TTL cache (60s)
5. Content-Length guard + X-Request-Id logging
6. Usage dashboard/alerting
7. (Paid) DO quota counters + Queue-buffered writes
