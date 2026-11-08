"""Clinical prediction endpoints."""
import io
import time
from typing import Dict, Any
import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from src.api.schemas.prediction import (
    ClinicalInput,
    ClinicalPrediction,
    BatchPredictionRequest,
    BatchPredictionResponse,
    FeatureAttribution,
)
from src.api.security.auth import verify_api_key
from src.config import FEATURES
from src.data.validator import validate_record, clean_dataframe, validate_schema
from src.explainability.attributions import calculate_local_attribution
from src.models.predict_model import predict_single as run_predict_single, predict_batch as run_predict_batch, calculate_confidence_interval
from src.models.registry import ModelRegistry
from src.monitoring.tracker import InferenceTracker

router = APIRouter(prefix="/predict", tags=["Clinical Prediction"])
registry = ModelRegistry()
tracker = InferenceTracker()


@router.post("", response_model=ClinicalPrediction)
async def predict_single(
    payload: ClinicalInput,
    auth: Dict[str, str] = Depends(verify_api_key),
) -> ClinicalPrediction:
    """Predict single patient treatment response."""
    start_time = time.perf_counter()
    record = payload.model_dump()

    is_valid, error = validate_record(record)
    if not is_valid:
        tracker.log_error(str(error), record)
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error)

    pipeline, meta = registry.load_active_model()
    if not pipeline or not meta:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="No active model deployed.")

    rmse = meta.get("metrics", {}).get("rmse", 1.45)
    score, eff_level, ci = run_predict_single(pipeline, record, rmse)
    attributions = calculate_local_attribution(record, score)
    latency_ms = (time.perf_counter() - start_time) * 1000.0

    tracker.log_inference(
        model_id=meta["model_id"],
        input_data=record,
        predicted_score=score,
        effectiveness=eff_level,
        latency_ms=latency_ms,
    )

    return ClinicalPrediction(
        predicted_score=score,
        effectiveness_level=eff_level,
        confidence_interval=ci,
        model_id=meta["model_id"],
        algorithm=meta.get("algorithm", "ensemble"),
        feature_attributions=[FeatureAttribution(**a) for a in attributions],
        latency_ms=round(latency_ms, 2),
    )


@router.post("/batch", response_model=BatchPredictionResponse)
async def predict_batch(
    payload: BatchPredictionRequest,
    auth: Dict[str, str] = Depends(verify_api_key),
) -> BatchPredictionResponse:
    """Batch inference across multiple patient records."""
    start_time = time.perf_counter()
    pipeline, meta = registry.load_active_model()
    if not pipeline or not meta:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="No active model deployed.")

    records = [r.model_dump() for r in payload.records]
    rmse = meta.get("metrics", {}).get("rmse", 1.45)
    batch_raw = run_predict_batch(pipeline, records, rmse)

    predictions = []
    dist = {"Low": 0, "Medium": 0, "High": 0}

    for item in batch_raw:
        eff = item["effectiveness_level"]
        dist[eff] += 1
        predictions.append(
            ClinicalPrediction(
                predicted_score=item["predicted_score"],
                effectiveness_level=eff,
                confidence_interval=item["confidence_interval"],
                model_id=meta["model_id"],
                algorithm=meta.get("algorithm", "ensemble"),
                feature_attributions=[FeatureAttribution(**a) for a in calculate_local_attribution(item["record"], item["predicted_score"])],
                latency_ms=0.0,
            )
        )

    batch_latency = (time.perf_counter() - start_time) * 1000.0
    scores = [p.predicted_score for p in predictions]

    return BatchPredictionResponse(
        total_processed=len(predictions),
        mean_predicted_score=round(float(np.mean(scores)), 2) if scores else 0.0,
        min_predicted_score=min(scores) if scores else 0.0,
        max_predicted_score=max(scores) if scores else 0.0,
        effectiveness_distribution=dist,
        predictions=predictions,
        batch_latency_ms=round(batch_latency, 2),
    )


@router.post("/upload-csv", response_model=BatchPredictionResponse)
async def predict_csv_upload(
    file: UploadFile = File(...),
    auth: Dict[str, str] = Depends(verify_api_key),
) -> BatchPredictionResponse:
    """Score uploaded clinical cohort CSV file."""
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid CSV: {str(e)}")

    valid, errs = validate_schema(df, require_target=False)
    if not valid:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=errs[0])

    df_clean = clean_dataframe(df, drop_target_na=False)
    inputs = [ClinicalInput(**row) for row in df_clean[FEATURES].to_dict(orient="records")]
    return await predict_batch(BatchPredictionRequest(records=inputs), auth=auth)
