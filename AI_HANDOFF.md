# AI Handoff & Architecture Checkpoint

## Task
Deploy Curavex End-to-End MLOps SaaS system with frontend on GitHub Pages, serverless backend on Vercel, automated GitHub Actions CI/CD pipeline, and Cookiecutter Data Science (CCDS) architecture.

## Repository & Revisions
- Repository: `https://github.com/krishujeniya/curavex`
- Branch: `main`
- Latest Commit: `f9a0ea2`
- Git Status: Sanitization and branding finalized; all legacy names removed

## Live Production Deployments
- Frontend SPA Dashboard: [https://krishujeniya.github.io/curavex/](https://krishujeniya.github.io/curavex/)
- Serverless Backend Gateway: [https://curavex.vercel.app](https://curavex.vercel.app)
- Interactive OpenAPI Documentation: [https://curavex.vercel.app/docs](https://curavex.vercel.app/docs)
- System Health Liveness Probe: [https://curavex.vercel.app/healthz](https://curavex.vercel.app/healthz)
- Legacy Alias Status: `https://drug-effectiveness-prediction.vercel.app` permanently deleted (HTTP 404 DEPLOYMENT_NOT_FOUND)

## CI/CD Pipeline Verification (GitHub Actions)
- `Curavex CI` (Run ID 42513779497): Status `completed`, Conclusion `success`
  - Dependencies: Installed via Python 3.12 runner
  - Data Pipeline: Executed `python -m src.data.make_dataset`
  - Automated Tests: 30/30 passed (100% pass rate)
  - Coverage Ratchet: Enforced `>= 80%` (achieved 85.97%)
- `Deploy Frontend to GitHub Pages` (Run ID 42513779435): Status `completed`, Conclusion `success`
  - Build Artifact: `frontend/` directory uploaded and published
  - Custom domain/subpath: `https://krishujeniya.github.io/curavex/`
  - Assets: All SVG/CSS/JS assets return HTTP 200

## Architecture Summary
- `data/`: Cookiecutter 4-tier data architecture (`raw/`, `interim/`, `processed/`, `external/`).
- `src/`: Modular application and pipeline package:
  - `src/data/`: `make_dataset.py`, `validator.py`.
  - `src/features/`: `build_features.py` (ColumnTransformer preprocessor).
  - `src/models/`: `train_model.py`, `predict_model.py`, `registry.py`.
  - `src/monitoring/`: `drift_detector.py` (KS-test, PSI), `tracker.py` (latency percentiles, telemetry).
  - `src/explainability/`: `attributions.py` (clinical feature impact attributions).
  - `src/api/`: `main.py`, `config.py`, `security/`, `schemas/`, `v1/`.
- `frontend/`: Emil Kowalski compliant clinical SaaS dashboard in dark obsidian theme with relative subpath asset resolution and automated backend target routing.
- `Makefile`: Standard automation (`make data`, `make train`, `make test`, `make coverage`, `make run`, `make clean`).

## Blocker
None. All systems operational and verified.

## Next Local Step
```bash
make run
```

## 2026-11-09 UI checkpoint
- Task: Restyle the Curavex clinical MLOps workspace using a clinical dark palette and improve keyboard/assistive-technology tab support.
- Branch/revision: `main`, starting revision `084ebfc`; UI changes are local and pending commit/push.
- Files: `frontend/index.html`, `frontend/css/curavex-shell.css`, `frontend/js/app.js`.
- Verification: `make data` completed; `make coverage` passed 30 tests at 84.97% coverage; `node --check frontend/js/app.js` and `git diff --check` passed. Browser checks against the live read-only API returned HTTP 200 for metadata, models, telemetry, drift, logs, and key listing. Mobile and desktop Lighthouse accessibility, best-practices, and SEO scores were 100. Layout had no horizontal overflow at 320, 360, 390, 768, 1024, 1280, 1440, or 1920 px. Workspace tabs responded to click and arrow keys.
- Blocker: GitHub Actions and Pages deployment have not yet run for this revision.
- Next command: `git push origin main` after creating the UI commit.
