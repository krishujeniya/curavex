# Curavex Documentation

## Architecture Overview

The repository is organized into four top-level workspaces:

- **`backend/`**: FastAPI application and Cookiecutter Data Science MLOps pipeline:
  - `src/data/`: Validation, hygiene, and ETL (`make_dataset.py`, `validator.py`).
  - `src/features/`: Column transformations and encoders (`build_features.py`).
  - `src/models/`: Training pipelines, inference runners, and registry governance (`train_model.py`, `predict_model.py`, `registry.py`).
  - `src/monitoring/`: Telemetry, KS-test/PSI drift detection, and latency percentiles (`drift_detector.py`, `tracker.py`).
  - `src/explainability/`: Local and global feature attribution (`attributions.py`).
  - `src/api/`: FastAPI REST serving, API key auth, rate limiting, and static frontend hosting.
  - `data/`, `models/registry/`, `logs/`, `tests/`: Datasets, serialized `.joblib` models, audit logs, and pytest suite.
- **`frontend/`**: Next.js 15 App Router static SPA using Tailwind CSS v4, Chart.js, and Wensity UI components.
- **`deploy/`**: `docker/Dockerfile`, `docker/docker-compose.yml`, and Cloudflare Worker edge configuration (`deploy/edge/`).
- **`docs/`**: Architecture overview, deployment runbook, data dictionary (`docs/references/`), and brand assets (`docs/reports/brand/`).
