# Curavex Repository Guidelines

- **Backend (`backend/`)**: FastAPI + scikit-learn managed with `uv`. Keep tests >= 80% coverage.
- **Frontend (`frontend/`)**: Next.js 15 App Router static export (`output: "export"`), Tailwind CSS v4, and Wensity UI components.
- **Deploy (`deploy/`, `wrangler.jsonc`)**: Cloudflare Pages (`curavex.pages.dev`) and Cloudflare Workers (`deploy/edge/worker.ts`).
- **Security**: Never commit `.env` files, API secrets, or unmasked keys.
