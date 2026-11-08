"""Model Registry management and retraining endpoints."""
from typing import List, Dict, Any
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status

from src.api.schemas.model import (
    ModelRecord,
    TrainModelRequest,
    PromoteModelRequest,
)
from src.api.security.auth import verify_api_key
from src.config import DATA_PATH
from src.data.validator import clean_dataframe
from src.explainability.attributions import extract_global_feature_importances
from src.models.registry import ModelRegistry
from src.models.train_model import train_single_model, run_benchmark_suite

router = APIRouter(prefix="/models", tags=["Model Registry & Governance"])
registry = ModelRegistry()


@router.get("", response_model=List[ModelRecord])
async def list_models(auth: Dict[str, str] = Depends(verify_api_key)) -> List[ModelRecord]:
    """Retrieve all models in registry."""
    items = registry.list_models()
    return [ModelRecord(**item) for item in items]


@router.get("/{model_id}")
async def get_model_details(model_id: str, auth: Dict[str, str] = Depends(verify_api_key)) -> Dict[str, Any]:
    """Fetch model metadata and global feature importances."""
    entry = registry.get_model_entry(model_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Model '{model_id}' not found.")

    pipeline, _ = registry.load_active_model()
    importances = extract_global_feature_importances(pipeline) if pipeline else []
    return {"model": entry, "feature_importances": importances}


@router.post("/train", response_model=ModelRecord)
async def train_model(
    payload: TrainModelRequest,
    auth: Dict[str, str] = Depends(verify_api_key),
) -> ModelRecord:
    """Train new candidate model."""
    if not DATA_PATH.exists():
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Dataset missing.")

    df = clean_dataframe(pd.read_csv(DATA_PATH))
    pipeline, report = train_single_model(
        df=df,
        algorithm=payload.algorithm,
        params=payload.hyperparameters or {},
        test_size=payload.test_size,
    )

    saved_entry = registry.register_model(
        pipeline=pipeline,
        algorithm=payload.algorithm,
        version=payload.version,
        metrics=report["test_metrics"],
        hyperparameters=report["hyperparameters"],
        status="STAGING",
        description=payload.description or "Retrained via API",
    )
    return ModelRecord(**saved_entry)


@router.post("/{model_id}/promote", response_model=ModelRecord)
async def promote_model(
    model_id: str,
    payload: PromoteModelRequest,
    auth: Dict[str, str] = Depends(verify_api_key),
) -> ModelRecord:
    """Promote model to target lifecycle stage."""
    stage = payload.target_stage.upper().strip()
    if stage not in ("PRODUCTION", "STAGING", "ARCHIVED"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid stage '{stage}'.")

    updated = registry.promote_model(model_id, stage)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Model '{model_id}' not found.")
    return ModelRecord(**updated)


@router.post("/benchmark")
async def benchmark_models(auth: Dict[str, str] = Depends(verify_api_key)) -> Dict[str, Any]:
    """Execute benchmark across candidate algorithms."""
    if not DATA_PATH.exists():
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Dataset missing.")

    df = clean_dataframe(pd.read_csv(DATA_PATH))
    results = run_benchmark_suite(df)
    return {"benchmark_suite": results}
