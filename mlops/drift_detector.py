"""MLOps drift detector alias re-exporting from src.monitoring.drift_detector."""
from src.monitoring.drift_detector import DriftDetector, calculate_psi

__all__ = ["DriftDetector", "calculate_psi"]
