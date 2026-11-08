# Project Documentation: Agyos Clinical MLOps Platform

## Architecture Overview
The system follows the Cookiecutter Data Science (CCDS) standard with modern production MLOps extensions:
- **`data/`**: Structured data storage across `raw/`, `interim/`, `processed/`, and `external/`.
- **`src/`**: Modular source code split by domain:
  - `data/`: Validation, hygiene, and ETL (`make_dataset.py`, `validator.py`).
  - `features/`: Column transformations and encoders (`build_features.py`).
  - `models/`: Training pipelines, inference runners, and registry governance (`train_model.py`, `predict_model.py`, `registry.py`).
  - `monitoring/`: Telemetry, drift detection, and latency percentiles (`drift_detector.py`, `tracker.py`).
  - `explainability/`: Local and global feature attribution (`attributions.py`).
  - `api/`: Enterprise FastAPI REST serving, token auth, rate limiting, and dashboard hosting.
- **`notebooks/`**: Exploratory data analysis and experimental modeling (`1.0-eda-and-model-exploration.ipynb`).
- **`models/`**: Serialized model artifacts (`.joblib`) and governance registry (`registry.json`).
- **`reports/`**: Benchmark summaries and generated analysis figures.
- **`references/`**: Data dictionaries and clinical regimens.
- **`frontend/`**: Modern web application built to Emil Kowalski's Design Engineering standards.
