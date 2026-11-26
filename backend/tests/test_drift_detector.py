"""Tests for KS-test drift detection and PSI categorical divergence."""
import pandas as pd
import numpy as np
import pytest

from mlops.drift_detector import DriftDetector, calculate_psi


def test_calculate_psi_identical_distributions():
    # Arrange
    base_counts = pd.Series({"Male": 50, "Female": 50})
    curr_counts = pd.Series({"Male": 50, "Female": 50})

    # Act
    psi = calculate_psi(base_counts, curr_counts)

    # Assert
    assert psi < 0.01  # Negligible PSI for identical distributions


def test_calculate_psi_shifted_distribution():
    # Arrange
    base_counts = pd.Series({"Male": 90, "Female": 10})
    curr_counts = pd.Series({"Male": 10, "Female": 90})

    # Act
    psi = calculate_psi(base_counts, curr_counts)

    # Assert
    assert psi > 0.25  # Significant divergence


def test_drift_detector_numeric():
    # Arrange: Baseline uniform around 50, Current heavily shifted to 90
    base_df = pd.DataFrame({
        "Age": np.random.normal(50, 5, 100),
        "Dosage_mg": np.random.normal(250, 20, 100),
        "Treatment_Duration_days": np.random.normal(30, 5, 100),
        "Gender": ["Male"] * 50 + ["Female"] * 50,
        "Condition": ["Hypertension"] * 100,
        "Drug_Name": ["Amlodipine"] * 100,
    })

    curr_df = pd.DataFrame({
        "Age": np.random.normal(85, 2, 50),  # Extreme drift in age
        "Dosage_mg": np.random.normal(250, 20, 50),
        "Treatment_Duration_days": np.random.normal(30, 5, 50),
        "Gender": ["Male"] * 25 + ["Female"] * 25,
        "Condition": ["Hypertension"] * 50,
        "Drug_Name": ["Amlodipine"] * 50,
    })

    detector = DriftDetector(baseline_df=base_df)

    # Act
    report = detector.analyze_dataset_drift(curr_df)

    # Assert
    assert report["overall_drift_detected"] is True
    assert "Age" in report["drifted_features"]
