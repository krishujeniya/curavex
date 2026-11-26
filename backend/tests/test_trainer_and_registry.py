"""Tests for model training metrics and ModelRegistry lifecycle."""
import tempfile
from pathlib import Path
import numpy as np
import pandas as pd
import pytest

from mlops.trainer import calculate_metrics, train_single_model
from mlops.registry import ModelRegistry


def test_calculate_metrics():
    # Arrange
    y_true = np.array([5.0, 6.0, 7.0, 8.0, 9.0])
    y_pred = np.array([5.2, 5.8, 7.1, 7.9, 9.1])

    # Act
    metrics = calculate_metrics(y_true, y_pred)

    # Assert
    assert "rmse" in metrics
    assert "mae" in metrics
    assert "r2" in metrics
    assert metrics["rmse"] < 0.3
    assert metrics["r2"] > 0.9


class DummyModel:
    """Module-level dummy estimator for pickling validation."""
    def predict(self, X):
        return np.array([7.0] * len(X))


def test_registry_lifecycle():
    # Arrange: Isolated temporary registry directory
    with tempfile.TemporaryDirectory() as tmp_dir:
        reg_dir = Path(tmp_dir)
        registry = ModelRegistry(registry_dir=reg_dir)

        dummy = DummyModel()

        # Act 1: Register model 1 in STAGING
        rec1 = registry.register_model(
            pipeline=dummy,
            algorithm="ridge",
            version="v1.0.0",
            metrics={"rmse": 1.2, "mae": 1.0, "mse": 1.44, "r2": 0.1, "pearson_corr": 0.2},
            hyperparameters={"alpha": 1.0},
            status="STAGING",
        )

        # Assert 1
        assert rec1["status"] == "STAGING"
        assert len(registry.list_models()) == 1

        # Act 2: Promote model 1 to PRODUCTION
        promoted = registry.promote_model(rec1["model_id"], "PRODUCTION")

        # Assert 2
        assert promoted["status"] == "PRODUCTION"

        # Act 3: Load active model
        loaded_pipe, loaded_meta = registry.load_active_model()
        assert loaded_pipe is not None
        assert loaded_meta["model_id"] == rec1["model_id"]

        # Act 4: Register model 2 in PRODUCTION and verify atomic demotion of model 1
        rec2 = registry.register_model(
            pipeline=dummy,
            algorithm="random_forest",
            version="v1.1.0",
            metrics={"rmse": 1.1, "mae": 0.9, "mse": 1.21, "r2": 0.2, "pearson_corr": 0.3},
            hyperparameters={"n_estimators": 50},
            status="PRODUCTION",
        )

        # Assert 4: rec1 must be ARCHIVED, rec2 is active PRODUCTION
        meta1 = registry.get_model_entry(rec1["model_id"])
        meta2 = registry.get_model_entry(rec2["model_id"])
        assert meta1["status"] == "ARCHIVED"
        assert meta2["status"] == "PRODUCTION"
