"""Monitoring and audit schemas."""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class NumericDriftMetric(BaseModel):
    drift_detected: bool
    p_value: float
    statistic: float
    baseline_mean: Optional[float] = None
    current_mean: Optional[float] = None
    note: Optional[str] = None


class CategoricalDriftMetric(BaseModel):
    drift_detected: bool
    psi: float
    status: Optional[str] = None
    note: Optional[str] = None


class DriftAnalysisResponse(BaseModel):
    total_features_evaluated: int
    drifted_features_count: int
    drifted_features: List[str]
    overall_drift_detected: bool
    numeric_metrics: Dict[str, NumericDriftMetric]
    categorical_metrics: Dict[str, CategoricalDriftMetric]


class LatencyPercentiles(BaseModel):
    avg: float
    p50: float
    p95: float
    p99: float


class TelemetryResponse(BaseModel):
    total_inferences: int
    total_errors: int
    error_rate_pct: float
    throughput_req_per_min: float
    latency_ms: LatencyPercentiles
    effectiveness_distribution: Dict[str, int]
    uptime_seconds: float


class AuditLogItem(BaseModel):
    timestamp: str
    model_id: Optional[str] = None
    input: Optional[Dict[str, Any]] = None
    predicted_score: Optional[float] = None
    effectiveness: Optional[str] = None
    latency_ms: Optional[float] = None
    client_ip: Optional[str] = None
    is_batch: Optional[bool] = False
    error: Optional[str] = None
    status: Optional[str] = None
