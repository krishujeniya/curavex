"""Tests for Cookiecutter Data Science ETL, prediction, and feature pipelines."""
import tempfile
from pathlib import Path
import pandas as pd
import numpy as np
import pytest

from src.data.make_dataset import process_dataset
from src.features.build_features import build_preprocessor
from src.models.predict_model import predict_single, predict_batch
from src.models.registry import ModelRegistry
from src.models.train_model import run_benchmark_suite


def test_process_dataset_etl():
    # Arrange
    with tempfile.TemporaryDirectory() as tmpdir:
        raw_csv = Path(tmpdir) / "raw.csv"
        out_csv = Path(tmpdir) / "processed.csv"

        df_raw = pd.DataFrame({
            "Age": [40, 50, 60],
            "Gender": ["Male", "Female", "Male"],
            "Condition": ["Hypertension", "Diabetes", "Depression"],
            "Drug_Name": ["Amlodipine", "Metformin", "Sertraline"],
            "Dosage_mg": [100.0, 500.0, 50.0],
            "Treatment_Duration_days": [30, 60, 45],
            "Improvement_Score": [7.0, 8.0, 7.5],
        })
        df_raw.to_csv(raw_csv, index=False)

        # Act
        df_proc = process_dataset(raw_path=raw_csv, output_path=out_csv)

        # Assert
        assert out_csv.exists()
        assert len(df_proc) == 3


def test_predict_model_single_and_batch():
    # Arrange
    registry = ModelRegistry()
    pipeline, meta = registry.load_active_model()
    if pipeline is None:
        pytest.skip("Active model not loaded")

    record = {
        "Age": 52,
        "Gender": "Male",
        "Condition": "Hypertension",
        "Drug_Name": "Amlodipine",
        "Dosage_mg": 250.0,
        "Treatment_Duration_days": 30,
    }

    # Act 1: Single
    score, tier, ci = predict_single(pipeline, record)

    # Assert 1
    assert 1.0 <= score <= 10.0
    assert tier in ("Low", "Medium", "High")
    assert len(ci) == 2

    # Act 2: Batch
    batch_res = predict_batch(pipeline, [record, record])

    # Assert 2
    assert len(batch_res) == 2
    assert batch_res[0]["predicted_score"] == score


def test_features_build_preprocessor():
    # Arrange
    preprocessor = build_preprocessor()
    df = pd.DataFrame({
        "Age": [35],
        "Dosage_mg": [200.0],
        "Treatment_Duration_days": [15],
        "Gender": ["Female"],
        "Condition": ["Infection"],
        "Drug_Name": ["Amoxicillin"],
    })

    # Act
    matrix = preprocessor.fit_transform(df)

    # Assert
    assert matrix.shape[0] == 1
    assert matrix.shape[1] > 3
