"""MLOps explainability alias re-exporting from src.explainability.attributions."""
from src.explainability.attributions import (
    extract_global_feature_importances,
    calculate_local_attribution,
)

__all__ = ["extract_global_feature_importances", "calculate_local_attribution"]
