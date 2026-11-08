"""Tests for global and local feature attribution calculations."""
import pytest
from mlops.explainability import calculate_local_attribution, extract_global_feature_importances
from mlops.registry import ModelRegistry


def test_calculate_local_attribution():
    # Arrange
    record = {
        "Age": 65,
        "Gender": "Male",
        "Condition": "Hypertension",
        "Drug_Name": "Amlodipine",
        "Dosage_mg": 500.0,
        "Treatment_Duration_days": 45,
    }
    score = 8.5

    # Act
    attributions = calculate_local_attribution(record, score)

    # Assert
    assert len(attributions) >= 4
    features = [a["feature"] for a in attributions]
    assert "Age" in features
    assert "Dosage_mg" in features
    assert "Treatment_Duration_days" in features


def test_extract_global_feature_importances_active_model():
    # Arrange
    registry = ModelRegistry()
    pipeline, _ = registry.load_active_model()
    if pipeline is None:
        pytest.skip("No active model loaded")

    # Act
    importances = extract_global_feature_importances(pipeline)

    # Assert
    assert len(importances) > 0
    total = sum(i["importance"] for i in importances)
    assert abs(total - 1.0) < 0.05
