# Deployment Guide: Curavex

Operational runbook for production deployment, health verification, and rollbacks.

---

## 1. Architecture and Topology

- **`curavex-frontend`**: Next.js 15 App Router static export (`frontend/out/`) hosted on Cloudflare Pages (`https://curavex.pages.dev`).
- **`curavex_saas`**: FastAPI drug prediction and MLOps service (`backend/src/api/main.py`, port `8000`), packaged in `deploy/docker/Dockerfile` and `deploy/docker/docker-compose.yml`.
- **`curavex-api`**: Cloudflare Worker edge gateway (`deploy/edge/worker.ts`) configured via `wrangler.jsonc`.

---

## 2. Environment Configuration

Copy the example files and configure secrets via `.env` (never commit `.env` files):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

---

## 3. Deployment Procedures

### Method A: Cloudflare Pages Deployment (Next.js Frontend)

```bash
cd frontend
npm install
npm run build
cd ..
wrangler pages deploy frontend/out --project-name=curavex --branch=main
```

### Method B: Cloudflare Workers Edge API Deployment

```bash
wrangler d1 info shared-production-db
wrangler deploy
```

### Method C: Local / VPS Container Parity (Docker Compose)

```bash
docker compose -f deploy/docker/docker-compose.yml up -d --build
docker compose -f deploy/docker/docker-compose.yml ps
```

### Method D: Pre-built Container Image (GHCR)

```bash
docker pull ghcr.io/krishujeniya/curavex:latest
docker run -d --restart unless-stopped -p 8000:8000 ghcr.io/krishujeniya/curavex:latest
```

---

## 4. Health Check and Verification

```bash
curl -f http://localhost:8000/healthz
curl -f https://api.curavex.workers.dev/healthz
curl -f https://curavex.pages.dev/
```

Expected HTTP response: `200 OK`.

---

## 5. Rollback Procedures

1. **Container rollback**:
   ```bash
   docker pull ghcr.io/krishujeniya/curavex:sha-<previous-commit-sha>
   git checkout <previous-stable-tag>
   docker compose -f deploy/docker/docker-compose.yml up -d
   ```
2. **Cloudflare Pages rollback**: Re-deploy the previous commit's `frontend/out/` via `wrangler pages deploy` or promote the previous deployment in Cloudflare Pages.
3. **Verify**: Re-run `curl -f https://api.curavex.workers.dev/healthz` and `curl -f https://curavex.pages.dev/`.

---

## 6. Scaling Notes

The edge Worker is stateless and horizontally scaled by Cloudflare across every PoP. Per-request costs:

- **Auth**: HMAC edge tokens verified locally; Clerk JWTs verified against a JWKS cache (5 min TTL) — no DB hit.
- **Billing/quota reads**: one `db.batch()` round-trip per request (subscription + monthly usage).
- **Quota writes**: one upsert per authenticated predict.
- **API keys**: SHA-256 hash lookup + monthly usage sum + daily upsert — all indexed on `key_hash` / `owner_id`.

D1 is single-threaded per database (~1k queries/sec ceiling). At very high authenticated-predict volume, move quota counters to a Durable Object or KV with atomic increments, and enable D1 read replication for the billing status reads. Static metadata endpoints (`/api/v1/metadata/*`, `/api/v1/models`, `/api/v1/monitoring/drift`, `/openapi.json`) send short `s-maxage` cache headers so repeat reads are absorbed at the edge.
