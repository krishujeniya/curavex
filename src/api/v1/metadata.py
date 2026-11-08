"""Clinical reference metadata endpoints."""
from typing import Dict, Any
import pandas as pd
from fastapi import APIRouter

from src.config import CONDITION_DRUG_MAP, ALLOWED_GENDERS, CLINICAL_BOUNDS, DATA_PATH
from src.data.validator import generate_data_health_report

router = APIRouter(prefix="/metadata", tags=["Clinical Reference Metadata"])


@router.get("/clinical")
async def get_clinical_metadata() -> Dict[str, Any]:
    return {
        "conditions": sorted(list(CONDITION_DRUG_MAP.keys())),
        "condition_drug_mapping": CONDITION_DRUG_MAP,
        "genders": ALLOWED_GENDERS,
        "clinical_bounds": CLINICAL_BOUNDS,
    }


@router.get("/dataset-stats")
async def get_dataset_statistics() -> Dict[str, Any]:
    if not DATA_PATH.exists():
        return {"error": "Canonical dataset missing."}
    df = pd.read_csv(DATA_PATH)
    return generate_data_health_report(df)
