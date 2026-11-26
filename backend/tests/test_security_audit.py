"""Security audit tests: ensure debug leaks, key exposure, and verbose health info stay blocked."""
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_debug_endpoint_removed() -> None:
    res = client.get("/api/debug")
    assert res.status_code == 404


def test_healthz_does_not_leak_internal_model_id() -> None:
    res = client.get("/healthz")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "active_model" not in data


def test_api_keys_list_masks_secrets() -> None:
    res = client.get("/api/v1/api-keys")
    assert res.status_code == 200
    keys = res.json()
    assert len(keys) > 0
    for item in keys:
        assert "••••" in item["api_key"]
        assert item["api_key"] != "live_agyos_clinical_enterprise_key_99x"
        assert item["api_key"] != "live_agyos_standard_key_44b"


def test_security_headers_present() -> None:
    res = client.get("/api/v1/api-keys")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert res.headers.get("Cache-Control") == "no-store"
