"""Prediction schema models."""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ClinicalInput(BaseModel):
    Age: int = Field(..., ge=1, le=120)
    Gender: str
    Condition: str
    Drug_Name: str
    Dosage_mg: float = Field(..., ge=5.0, le=2000.0)
    Treatment_Duration_days: int = Field(..., ge=1, le=365)


class FeatureAttribution(BaseModel):
    feature: str
    impact: float


class ClinicalPrediction(BaseModel):
    predicted_score: float
    effectiveness_level: str
    confidence_interval: List[float]
    model_id: str
    algorithm: str
    feature_attributions: List[FeatureAttribution] = Field(default_factory=list)
    latency_ms: float


class BatchPredictionRequest(BaseModel):
    records: List[ClinicalInput]


class BatchPredictionResponse(BaseModel):
    total_processed: int
    mean_predicted_score: float
    min_predicted_score: float
    max_predicted_score: float
    effectiveness_distribution: Dict[str, int]
    predictions: List[ClinicalPrediction]
    batch_latency_ms: float
