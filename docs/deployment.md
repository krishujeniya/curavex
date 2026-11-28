# Deployment Guide: Curavex

Operational runbook for production deployment, health verification, and rollbacks.

---

## 1. Architecture and Topology

- **`curavex-frontend`**: Next.js 15 App Router static export (`frontend/out/`) hosted on Cloudflare Pages (`https://curavex.pages.dev`).
- **`curavex_saas`**: FastAPI drug prediction and MLOps service (`backend/src/api/main.py`, port `8000`), packaged in `deploy/Dockerfile` and `deploy/docker-compose.yml`.
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
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml ps
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
   docker compose -f deploy/docker-compose.yml up -d
   ```
2. **Cloudflare Pages rollback**: Re-deploy the previous commit's `frontend/out/` via `wrangler pages deploy` or promote the previous deployment in Cloudflare Pages.
3. **Verify**: Re-run `curl -f https://api.curavex.workers.dev/healthz` and `curl -f https://curavex.pages.dev/`.
