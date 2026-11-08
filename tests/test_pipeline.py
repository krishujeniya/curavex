"""Tests for preprocessing transformer and estimator construction."""
import pandas as pd
import numpy as np
import pytest

from mlops.pipeline import (
    build_preprocessor,
    create_model_estimator,
    build_training_pipeline,
)


def test_build_preprocessor():
    # Arrange
    preprocessor = build_preprocessor()
    df = pd.DataFrame({
        "Age": [30, 50],
        "Dosage_mg": [100.0, 200.0],
        "Treatment_Duration_days": [10, 20],
        "Gender": ["Male", "Female"],
        "Condition": ["Hypertension", "Infection"],
        "Drug_Name": ["Amlodipine", "Amoxicillin"],
    })

    # Act
    transformed = preprocessor.fit_transform(df)

    # Assert
    assert transformed.shape[0] == 2
    assert transformed.shape[1] > 3  # Numerics + one-hot encoded categories


def test_create_model_estimators():
    # Arrange & Act
    gb = create_model_estimator("gradient_boosting", {"n_estimators": 10})
    rf = create_model_estimator("random_forest", {"n_estimators": 10})
    ridge = create_model_estimator("ridge", {"alpha": 0.5})
    dt = create_model_estimator("decision_tree", {"max_depth": 3})

    # Assert
    assert gb.__class__.__name__ == "GradientBoostingRegressor"
    assert rf.__class__.__name__ == "RandomForestRegressor"
    assert ridge.__class__.__name__ == "Ridge"
    assert dt.__class__.__name__ == "DecisionTreeRegressor"


def test_build_training_pipeline_fit_predict():
    # Arrange
    pipeline = build_training_pipeline("ridge", {"alpha": 1.0})
    X = pd.DataFrame({
        "Age": [25, 45, 65, 35],
        "Dosage_mg": [100.0, 250.0, 500.0, 100.0],
        "Treatment_Duration_days": [7, 14, 30, 21],
        "Gender": ["Male", "Female", "Male", "Female"],
        "Condition": ["Infection", "Hypertension", "Diabetes", "Depression"],
        "Drug_Name": ["Amoxicillin", "Amlodipine", "Metformin", "Sertraline"],
    })
    y = np.array([7.0, 8.5, 6.2, 7.8])

    # Act
    pipeline.fit(X, y)
    preds = pipeline.predict(X)

    # Assert
    assert len(preds) == 4
    assert np.all(np.isfinite(preds))
