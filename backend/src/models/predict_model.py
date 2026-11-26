"""Clinical prediction execution, 95% confidence bounds, and effectiveness categorization."""
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd

from src.config import FEATURES


def get_effectiveness_tier(score: float) -> str:
    """Classify improvement score into clinical efficacy level."""
    if score <= 4.5:
        return "Low"
    elif score <= 7.5:
        return "Medium"
    return "High"


def calculate_confidence_interval(score: float, rmse: float = 1.45) -> List[float]:
    """Derive 95% prediction interval bounded within [1.0, 10.0]."""
    margin = 1.96 * (rmse / 2.0)
    lower = max(1.0, round(score - margin, 2))
    upper = min(10.0, round(score + margin, 2))
    return [lower, upper]


def predict_single(pipeline: Any, record: Dict[str, Any], rmse: float = 1.45) -> Tuple[float, str, List[float]]:
    """Generate score, tier, and confidence interval for a single record."""
    df_input = pd.DataFrame([record])[FEATURES]
    raw_pred = pipeline.predict(df_input)[0]
    score = round(float(np.clip(raw_pred, 1.0, 10.0)), 2)
    tier = get_effectiveness_tier(score)
    ci = calculate_confidence_interval(score, rmse)
    return score, tier, ci


def predict_batch(pipeline: Any, records: List[Dict[str, Any]], rmse: float = 1.45) -> List[Dict[str, Any]]:
    """Vectorized scoring of multiple clinical patient records."""
    df_input = pd.DataFrame(records)[FEATURES]
    raw_preds = pipeline.predict(df_input)
    clipped = np.clip(raw_preds, 1.0, 10.0)

    results = []
    for rec, val in zip(records, clipped):
        sc = round(float(val), 2)
        tier = get_effectiveness_tier(sc)
        results.append({
            "record": rec,
            "predicted_score": sc,
            "effectiveness_level": tier,
            "confidence_interval": calculate_confidence_interval(sc, rmse),
        })
    return results
