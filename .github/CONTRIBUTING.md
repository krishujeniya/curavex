# Contributing to Curavex

1. Keep `main` clean; use short-lived feature branches if opening a PR.
2. Backend uses `uv` (`cd backend && uv sync`) and enforces >= 80% test coverage (`make coverage`).
3. Frontend uses Next.js 15 App Router (`cd frontend && npm run typecheck && npm run build`).
4. Never commit secrets, `.env` files, or agent metadata.
