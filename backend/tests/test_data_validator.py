"""Tests for schema validation, record checking, and clinical constraints."""
import pandas as pd
import pytest

from mlops.data_validator import (
    validate_schema,
    clean_dataframe,
    validate_record,
    generate_data_health_report,
)


def test_validate_schema_valid():
    # Arrange
    df = pd.DataFrame(
        columns=[
            "Age", "Gender", "Condition", "Drug_Name",
            "Dosage_mg", "Treatment_Duration_days", "Improvement_Score"
        ]
    )

    # Act
    is_valid, errors = validate_schema(df, require_target=True)

    # Assert
    assert is_valid is True
    assert len(errors) == 0


def test_validate_schema_missing_column():
    # Arrange
    df = pd.DataFrame(columns=["Age", "Gender"])

    # Act
    is_valid, errors = validate_schema(df, require_target=False)

    # Assert
    assert is_valid is False
    assert "Missing required column(s)" in errors[0]


def test_clean_dataframe_imputation():
    # Arrange
    raw_data = {
        "Age": ["45", None, "60"],
        "Gender": [" Male ", "Female", "Male"],
        "Condition": ["Hypertension", "Diabetes", "Hypertension"],
        "Drug_Name": ["Amlodipine", "Metformin", "Amlodipine"],
        "Dosage_mg": [100.0, 500.0, None],
        "Treatment_Duration_days": [30, 60, 30],
        "Improvement_Score": [7.5, 8.0, 6.0],
    }
    df = pd.DataFrame(raw_data)

    # Act
    cleaned = clean_dataframe(df)

    # Assert
    assert cleaned["Gender"].iloc[0] == "Male"
    assert cleaned["Age"].isnull().sum() == 0
    assert cleaned["Dosage_mg"].isnull().sum() == 0


def test_validate_record_valid():
    # Arrange
    record = {
        "Age": 55,
        "Gender": "Female",
        "Condition": "Hypertension",
        "Drug_Name": "Amlodipine",
        "Dosage_mg": 100.0,
        "Treatment_Duration_days": 30,
    }

    # Act
    is_valid, err = validate_record(record)

    # Assert
    assert is_valid is True
    assert err is None


def test_validate_record_invalid_drug_for_condition():
    # Arrange: Paracetamol is not approved for Hypertension
    record = {
        "Age": 55,
        "Gender": "Female",
        "Condition": "Hypertension",
        "Drug_Name": "Paracetamol",
        "Dosage_mg": 100.0,
        "Treatment_Duration_days": 30,
    }

    # Act
    is_valid, err = validate_record(record)

    # Assert
    assert is_valid is False
    assert "not approved for condition" in err


def test_validate_record_out_of_bounds():
    # Arrange: Age is 250 (out of bounds)
    record = {
        "Age": 250,
        "Gender": "Male",
        "Condition": "Depression",
        "Drug_Name": "Sertraline",
        "Dosage_mg": 50.0,
        "Treatment_Duration_days": 30,
    }

    # Act
    is_valid, err = validate_record(record)

    # Assert
    assert is_valid is False
    assert "outside clinical boundary" in err


def test_generate_data_health_report():
    # Arrange
    df = pd.DataFrame({
        "Age": [30, 40, 50],
        "Gender": ["Male", "Female", "Male"],
        "Condition": ["Depression", "Depression", "Diabetes"],
        "Drug_Name": ["Sertraline", "Sertraline", "Metformin"],
        "Dosage_mg": [50.0, 50.0, 500.0],
        "Treatment_Duration_days": [14, 14, 30],
        "Improvement_Score": [6.0, 7.0, 8.0],
    })

    # Act
    report = generate_data_health_report(df)

    # Assert
    assert report["total_records"] == 3
    assert "Age" in report["numeric_stats"]
    assert report["numeric_stats"]["Age"]["mean"] == 40.0
