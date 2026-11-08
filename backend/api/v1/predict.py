"""Predict router alias re-exporting from src.api.v1.predict."""
from src.api.v1.predict import router, get_effectiveness_tier, calculate_confidence_interval

__all__ = ["router", "get_effectiveness_tier", "calculate_confidence_interval"]
