"""MLOps trainer alias re-exporting from src.models.train_model."""
from src.models.train_model import (
    calculate_metrics,
    train_single_model,
    run_benchmark_suite,
)

__all__ = ["calculate_metrics", "train_single_model", "run_benchmark_suite"]
