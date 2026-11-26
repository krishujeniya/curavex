"""Integration tests for all FastAPI REST API endpoints."""
import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)
VALID_API_KEY = "live_agyos_clinical_enterprise_key_99x"
AUTH_HEADERS = {"X-API-Key": VALID_API_KEY}


def test_health_check_endpoint():
    # Act
    res = client.get("/healthz")

    # Assert
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_system_metrics_endpoint():
    # Act
    res = client.get("/metrics")

    # Assert
    assert res.status_code == 200
    data = res.json()
    assert "total_inferences" in data
    assert "latency_ms" in data


def test_clinical_metadata_endpoint():
    # Act
    res = client.get("/api/v1/metadata/clinical")

    # Assert
    assert res.status_code == 200
    data = res.json()
    assert "conditions" in data
    assert "Hypertension" in data["conditions"]
    assert "Amlodipine" in data["condition_drug_mapping"]["Hypertension"]


def test_predict_single_endpoint_success():
    # Arrange
    payload = {
        "Age": 50,
        "Gender": "Female",
        "Condition": "Hypertension",
        "Drug_Name": "Amlodipine",
        "Dosage_mg": 250.0,
        "Treatment_Duration_days": 30,
    }

    # Act
    res = client.post("/api/v1/predict", json=payload, headers=AUTH_HEADERS)

    # Assert
    assert res.status_code == 200
    data = res.json()
    assert "predicted_score" in data
    assert 1.0 <= data["predicted_score"] <= 10.0
    assert data["effectiveness_level"] in ("Low", "Medium", "High")
    assert len(data["confidence_interval"]) == 2
    assert len(data["feature_attributions"]) > 0


def test_predict_single_endpoint_validation_failure():
    # Arrange: Invalid drug for given condition
    payload = {
        "Age": 50,
        "Gender": "Female",
        "Condition": "Hypertension",
        "Drug_Name": "Metformin",  # Metformin is for diabetes, not hypertension
        "Dosage_mg": 250.0,
        "Treatment_Duration_days": 30,
    }

    # Act
    res = client.post("/api/v1/predict", json=payload, headers=AUTH_HEADERS)

    # Assert
    assert res.status_code == 422
    assert "not approved for condition" in res.json()["detail"]


def test_predict_batch_endpoint():
    # Arrange
    payload = {
        "records": [
            {
                "Age": 45,
                "Gender": "Male",
                "Condition": "Depression",
                "Drug_Name": "Sertraline",
                "Dosage_mg": 50.0,
                "Treatment_Duration_days": 30,
            },
            {
                "Age": 62,
                "Gender": "Female",
                "Condition": "Infection",
                "Drug_Name": "Azithromycin",
                "Dosage_mg": 250.0,
                "Treatment_Duration_days": 7,
            },
        ]
    }

    # Act
    res = client.post("/api/v1/predict/batch", json=payload, headers=AUTH_HEADERS)

    # Assert
    assert res.status_code == 200
    data = res.json()
    assert data["total_processed"] == 2
    assert len(data["predictions"]) == 2
    assert "mean_predicted_score" in data


def test_models_list_and_details():
    # Act
    res = client.get("/api/v1/models", headers=AUTH_HEADERS)

    # Assert
    assert res.status_code == 200
    models = res.json()
    assert len(models) >= 1
    model_id = models[0]["model_id"]

    # Act 2: Detail endpoint
    detail_res = client.get(f"/api/v1/models/{model_id}", headers=AUTH_HEADERS)
    assert detail_res.status_code == 200
    assert "model" in detail_res.json()


def test_models_promote_endpoint():
    # Arrange: Get a staging model or first model
    list_res = client.get("/api/v1/models", headers=AUTH_HEADERS)
    models = list_res.json()
    target_id = models[0]["model_id"]

    # Act
    res = client.post(
        f"/api/v1/models/{target_id}/promote",
        json={"target_stage": "PRODUCTION"},
        headers=AUTH_HEADERS,
    )

    # Assert
    assert res.status_code == 200
    assert res.json()["status"] == "PRODUCTION"


def test_monitoring_telemetry_and_drift():
    # Act 1: Telemetry
    tel_res = client.get("/api/v1/monitoring/metrics", headers=AUTH_HEADERS)
    assert tel_res.status_code == 200
    assert "total_inferences" in tel_res.json()

    # Act 2: Drift
    drift_res = client.get("/api/v1/monitoring/drift", headers=AUTH_HEADERS)
    assert drift_res.status_code == 200
    assert "overall_drift_detected" in drift_res.json()


def test_api_keys_list_and_generation():
    # Act 1: List
    res_list = client.get("/api/v1/api-keys", headers=AUTH_HEADERS)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1

    # Act 2: Generate
    res_gen = client.post(
        "/api/v1/api-keys/generate",
        json={"name": "QA Test Suite Client", "tier": "enterprise"},
        headers=AUTH_HEADERS,
    )
    assert res_gen.status_code == 200
    data = res_gen.json()
    assert data["tier"] == "enterprise"
    assert "live_agyos_" in data["api_key"]
