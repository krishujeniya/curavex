"""Monitoring and drift endpoints."""
from typing import List, Optional
import pandas as pd
from fastapi import APIRouter, Depends, Query

from src.api.schemas.monitoring import (
    DriftAnalysisResponse,
    TelemetryResponse,
    AuditLogItem,
)
from src.api.security.auth import verify_api_key
from src.monitoring.drift_detector import DriftDetector
from src.monitoring.tracker import InferenceTracker

router = APIRouter(prefix="/monitoring", tags=["MLOps Observability & Drift"])
tracker = InferenceTracker()
drift_detector = DriftDetector()


@router.get("/metrics", response_model=TelemetryResponse)
async def get_system_telemetry(auth: dict = Depends(verify_api_key)) -> TelemetryResponse:
    """Fetch operational telemetry and latency percentiles."""
    data = tracker.get_telemetry_metrics()
    return TelemetryResponse(**data)


@router.get("/drift", response_model=DriftAnalysisResponse)
async def analyze_drift(auth: dict = Depends(verify_api_key)) -> DriftAnalysisResponse:
    """Evaluate distribution drift against training baseline."""
    recent_logs = tracker.get_recent_logs(limit=200)
    records = [r.get("input") for r in recent_logs if r.get("input")]

    if not records:
        if not drift_detector.baseline_df.empty:
            curr_df = drift_detector.baseline_df.sample(min(len(drift_detector.baseline_df), 100), random_state=42)
        else:
            curr_df = pd.DataFrame()
    else:
        curr_df = pd.DataFrame(records)

    analysis = drift_detector.analyze_dataset_drift(curr_df)
    return DriftAnalysisResponse(**analysis)


@router.get("/logs", response_model=List[AuditLogItem])
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=500),
    effectiveness: Optional[str] = Query(None),
    auth: dict = Depends(verify_api_key),
) -> List[AuditLogItem]:
    """Retrieve audit log stream."""
    logs = tracker.get_recent_logs(limit=limit, filter_eff=effectiveness)
    return [AuditLogItem(**item) for item in logs]
