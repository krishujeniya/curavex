"""Tests for high-concurrency caching, buffered telemetry, and O(1) rate limiting."""
from pathlib import Path
import pytest
from fastapi import HTTPException
from sklearn.dummy import DummyRegressor

from src.api.security.auth import check_rate_limit, _request_buckets
from src.models.registry import ModelRegistry
from src.monitoring.tracker import InferenceTracker


def test_registry_caches_active_model_and_invalidates_on_promote(tmp_path: Path) -> None:
    reg = ModelRegistry(registry_dir=tmp_path)
    m1 = reg.register_model(
        DummyRegressor(),
        "ridge",
        "v1.0.0",
        {"rmse": 1.2},
        {},
        status="PRODUCTION",
    )
    m2 = reg.register_model(
        DummyRegressor(),
        "ridge",
        "v1.1.0",
        {"rmse": 1.1},
        {},
        status="STAGING",
    )

    p1, meta1 = reg.load_active_model()
    p1_cached, _ = reg.load_active_model()
    assert meta1 is not None and meta1["model_id"] == m1["model_id"]
    assert p1 is p1_cached

    reg.promote_model(m2["model_id"], "PRODUCTION")
    p2, meta2 = reg.load_active_model()
    assert meta2 is not None and meta2["model_id"] == m2["model_id"]
    assert p2 is not p1


def test_tracker_buffers_writes_until_batch_or_flush(tmp_path: Path) -> None:
    tracker = InferenceTracker(log_dir=tmp_path, buffer_size=100, flush_batch_size=3)
    tracker.log_inference("m1", {"Age": 40}, 7.2, "High", 1.5)
    tracker.log_inference("m1", {"Age": 41}, 7.3, "High", 1.6)
    assert not tracker.log_file.exists()

    tracker.log_inference("m1", {"Age": 42}, 7.4, "High", 1.4)
    assert tracker.log_file.exists()
    assert len(tracker.log_file.read_text(encoding="utf-8").splitlines()) == 3

    tracker.log_error("validation error", {"Age": -1})
    assert len(tracker.log_file.read_text(encoding="utf-8").splitlines()) == 3
    tracker.flush()
    assert len(tracker.log_file.read_text(encoding="utf-8").splitlines()) == 4


def test_rate_limiter_enforces_tier_limit_with_deque() -> None:
    key = "test_concurrency_key"
    _request_buckets.pop(key, None)
    for _ in range(60):
        check_rate_limit(key, "free")

    with pytest.raises(HTTPException) as exc:
        check_rate_limit(key, "free")
    assert exc.value.status_code == 429
    _request_buckets.pop(key, None)
