"""Continuous data drift monitoring via Kolmogorov-Smirnov tests and categorical PSI."""
from typing import Dict, Any, List
import numpy as np
import pandas as pd
from scipy.stats import ks_2samp

from src.config import (
    NUMERIC_FEATURES,
    CATEGORICAL_FEATURES,
    DRIFT_P_VALUE_THRESHOLD,
    DATA_PATH,
)


def calculate_psi(baseline_counts: pd.Series, current_counts: pd.Series, epsilon: float = 1e-4) -> float:
    """Compute Population Stability Index for categorical shifts."""
    all_categories = sorted(list(set(baseline_counts.index).union(set(current_counts.index))))
    base_total = baseline_counts.sum()
    curr_total = current_counts.sum()

    psi = 0.0
    for cat in all_categories:
        b_pct = (baseline_counts.get(cat, 0) + epsilon) / (base_total + epsilon * len(all_categories))
        c_pct = (current_counts.get(cat, 0) + epsilon) / (curr_total + epsilon * len(all_categories))
        psi += (c_pct - b_pct) * np.log(c_pct / b_pct)

    return float(psi)


class DriftDetector:
    """Statistical drift comparison against baseline clinical training distributions."""

    def __init__(self, baseline_df: pd.DataFrame = None):
        if baseline_df is None:
            if DATA_PATH.exists():
                baseline_df = pd.read_csv(DATA_PATH)
            else:
                baseline_df = pd.DataFrame()
        self.baseline_df = baseline_df

    def detect_numeric_drift(self, current_df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
        """Run 2-sample Kolmogorov-Smirnov test across continuous variables."""
        report = {}
        for feature in NUMERIC_FEATURES:
            if feature not in current_df.columns or feature not in self.baseline_df.columns:
                continue

            base_vals = pd.to_numeric(self.baseline_df[feature], errors="coerce").dropna().values
            curr_vals = pd.to_numeric(current_df[feature], errors="coerce").dropna().values

            if len(curr_vals) < 3:
                report[feature] = {"drift_detected": False, "p_value": 1.0, "statistic": 0.0, "note": "Insufficient samples"}
                continue

            ks_res = ks_2samp(base_vals, curr_vals)
            p_val = float(ks_res.pvalue)
            stat = float(ks_res.statistic)
            report[feature] = {
                "drift_detected": bool(p_val < DRIFT_P_VALUE_THRESHOLD),
                "p_value": round(p_val, 4),
                "statistic": round(stat, 4),
                "baseline_mean": round(float(np.mean(base_vals)), 2),
                "current_mean": round(float(np.mean(curr_vals)), 2),
            }
        return report

    def detect_categorical_drift(self, current_df: pd.DataFrame) -> Dict[str, Dict[str, Any]]:
        """Compute PSI distance on categorical variables."""
        report = {}
        for feature in CATEGORICAL_FEATURES:
            if feature not in current_df.columns or feature not in self.baseline_df.columns:
                continue

            base_counts = self.baseline_df[feature].astype(str).str.strip().value_counts()
            curr_counts = current_df[feature].astype(str).str.strip().value_counts()

            if len(current_df) < 3:
                report[feature] = {"drift_detected": False, "psi": 0.0, "note": "Insufficient samples"}
                continue

            psi_val = calculate_psi(base_counts, curr_counts)
            drift = bool(psi_val > 0.25)
            report[feature] = {
                "drift_detected": drift,
                "psi": round(psi_val, 4),
                "status": "Significant Shift" if drift else ("Moderate Shift" if psi_val > 0.1 else "Stable"),
            }
        return report

    def analyze_dataset_drift(self, current_df: pd.DataFrame) -> Dict[str, Any]:
        """Synthesize numeric and categorical checks into overall drift status."""
        num_report = self.detect_numeric_drift(current_df)
        cat_report = self.detect_categorical_drift(current_df)

        drifted_features = [
            f for f, r in num_report.items() if r.get("drift_detected")
        ] + [
            f for f, r in cat_report.items() if r.get("drift_detected")
        ]

        return {
            "total_features_evaluated": len(num_report) + len(cat_report),
            "drifted_features_count": len(drifted_features),
            "drifted_features": drifted_features,
            "overall_drift_detected": len(drifted_features) > 0,
            "numeric_metrics": num_report,
            "categorical_metrics": cat_report,
        }
