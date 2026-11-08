"""Model governance schemas."""
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class ModelRecord(BaseModel):
    model_id: str
    algorithm: str
    version: str
    status: str
    description: Optional[str] = ""
    created_at: str
    metrics: Dict[str, Any]
    hyperparameters: Dict[str, Any]


class TrainModelRequest(BaseModel):
    algorithm: str = Field(default="gradient_boosting")
    version: str = Field(default="v2.0.0")
    description: Optional[str] = "Retrained clinical model"
    hyperparameters: Optional[Dict[str, Any]] = None
    test_size: float = Field(default=0.2, ge=0.05, le=0.5)


class PromoteModelRequest(BaseModel):
    target_stage: str
