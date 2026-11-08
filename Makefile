.PHONY: help data train test coverage run docker-build docker-run clean

PYTHON := PYTHONPATH=. .venv/bin/python
PYTEST := PYTHONPATH=. .venv/bin/pytest
UVICORN := PYTHONPATH=. .venv/bin/uvicorn

help:
	@echo "Cookiecutter Data Science & MLOps Automation Commands"
	@echo "  make data         - Preprocess raw clinical data into data/processed/"
	@echo "  make train        - Train baseline and candidate models into models/registry/"
	@echo "  make test         - Run full automated pytest test suite"
	@echo "  make coverage     - Run test suite with code coverage analysis"
	@echo "  make run          - Start FastAPI SaaS server and Dashboard on port 8000"
	@echo "  make docker-build - Build production Docker image"
	@echo "  make docker-run   - Run application via docker-compose"
	@echo "  make clean        - Clean temporary files, caches, and test artifacts"

data:
	$(PYTHON) src/data/make_dataset.py

train: data
	$(PYTHON) -c "import pandas as pd; from src.config import DATA_PROCESSED_PATH; from src.models.train_model import train_single_model; from src.models.registry import ModelRegistry; df = pd.read_csv(DATA_PROCESSED_PATH); reg = ModelRegistry(); pipe, rep = train_single_model(df, 'gradient_boosting', {'n_estimators': 150, 'max_depth': 4, 'learning_rate': 0.01}); reg.register_model(pipe, 'gradient_boosting', 'v2.0.0', rep['test_metrics'], rep['hyperparameters'], status='PRODUCTION', description='Default production model'); print('Trained and registered production model.')"

test:
	$(PYTEST) tests/ -v

coverage:
	$(PYTEST) --cov=src tests/

run:
	$(UVICORN) src.api.main:app --host 0.0.0.0 --port 8000 --reload

docker-build:
	docker build -t agyos-clinical-mlops:latest .

docker-run:
	docker compose up --build

clean:
	find . -type f -name "*.py[co]" -delete
	find . -type d -name "__pycache__" -delete
	rm -rf .pytest_cache .coverage htmlcov
