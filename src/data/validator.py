"""Validation logic for data schemas, categorical constraints, and clinical boundaries."""
from typing import Dict, List, Tuple, Any, Optional
import pandas as pd
import numpy as np

from src.config import (
    FEATURES,
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    TARGET_FEATURE,
    CLINICAL_BOUNDS,
    CONDITION_DRUG_MAP,
    ALLOWED_GENDERS,
)


def validate_schema(df: pd.DataFrame, require_target: bool = False) -> Tuple[bool, List[str]]:
    """Validate expected columns presence."""
    required = list(FEATURES)
    if require_target:
        required.append(TARGET_FEATURE)
    missing = [c for c in required if c not in df.columns]
    if missing:
        return False, [f"Missing required column(s): {', '.join(missing)}"]
    return True, []


def clean_dataframe(df: pd.DataFrame, drop_target_na: bool = True) -> pd.DataFrame:
    """Normalize whitespace, convert numeric types, and impute missing values."""
    cleaned = df.copy()
    for col in CATEGORICAL_FEATURES:
        if col in cleaned.columns:
            cleaned[col] = cleaned[col].astype(str).str.strip()

    for col in NUMERIC_FEATURES:
        if col in cleaned.columns:
            cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce")

    if drop_target_na and TARGET_FEATURE in cleaned.columns:
        cleaned[TARGET_FEATURE] = pd.to_numeric(cleaned[TARGET_FEATURE], errors="coerce")
        cleaned = cleaned.dropna(subset=[TARGET_FEATURE])

    for col in NUMERIC_FEATURES:
        if col in cleaned.columns and cleaned[col].isnull().any():
            cleaned[col] = cleaned[col].fillna(cleaned[col].median())

    return cleaned


def validate_record(record: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate a single inference patient record against clinical protocols."""
    for col in FEATURES:
        if col not in record:
            return False, f"Missing feature: {col}"

    gender = str(record["Gender"]).strip()
    if gender not in ALLOWED_GENDERS:
        return False, f"Invalid gender '{gender}'. Allowed: {ALLOWED_GENDERS}"

    condition = str(record["Condition"]).strip()
    if condition not in CONDITION_DRUG_MAP:
        return False, f"Unknown condition '{condition}'. Allowed: {list(CONDITION_DRUG_MAP.keys())}"

    drug = str(record["Drug_Name"]).strip()
    valid_drugs = CONDITION_DRUG_MAP[condition]
    if drug not in valid_drugs:
        return False, f"Drug '{drug}' is not approved for condition '{condition}'. Valid: {valid_drugs}"

    for num_col in NUMERIC_FEATURES:
        val = record[num_col]
        try:
            val_num = float(val)
        except (ValueError, TypeError):
            return False, f"Field '{num_col}' must be numeric, got '{val}'"
        bounds = CLINICAL_BOUNDS[num_col]
        if val_num < bounds["min"] or val_num > bounds["max"]:
            return False, (
                f"Value {val_num} for '{num_col}' outside clinical boundary "
                f"[{bounds['min']}, {bounds['max']}]"
            )

    return True, None


def generate_data_health_report(df: pd.DataFrame) -> Dict[str, Any]:
    """Calculate completeness and summary distribution metrics."""
    total_records = len(df)
    null_counts = df[FEATURES].isnull().sum().to_dict() if set(FEATURES).issubset(df.columns) else {}
    stats = {}
    for col in NUMERIC_FEATURES:
        if col in df.columns:
            stats[col] = {
                "mean": round(float(df[col].mean()), 2),
                "std": round(float(df[col].std()), 2),
                "min": round(float(df[col].min()), 2),
                "max": round(float(df[col].max()), 2),
            }

    condition_counts = (
        df["Condition"].value_counts().to_dict() if "Condition" in df.columns else {}
    )

    return {
        "total_records": total_records,
        "null_counts": null_counts,
        "numeric_stats": stats,
        "condition_distribution": condition_counts,
        "is_healthy": total_records > 0,
    }
