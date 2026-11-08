"""Model training pipelines, hyperparameter configuration, and benchmark evaluation."""
from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    root_mean_squared_error,
    mean_absolute_error,
    r2_score,
    mean_squared_error,
)
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.tree import DecisionTreeRegressor
from scipy.stats import pearsonr

from src.config import FEATURES, TARGET_FEATURE, DATA_PROCESSED_PATH, DATA_PATH
from src.features.build_features import build_preprocessor


def create_model_estimator(algorithm: str, params: Dict[str, Any]) -> Any:
    """Instantiate scikit-learn regressor from algorithm key and hyperparameter dictionary."""
    algo = algorithm.lower().strip()
    if algo in ("gradient_boosting", "gradientboosting"):
        return GradientBoostingRegressor(
            random_state=params.get("random_state", 42),
            n_estimators=params.get("n_estimators", 150),
            max_depth=params.get("max_depth", 4),
            learning_rate=params.get("learning_rate", 0.01),
            subsample=params.get("subsample", 0.8),
            min_samples_split=params.get("min_samples_split", 10),
            min_samples_leaf=params.get("min_samples_leaf", 4),
        )
    elif algo in ("random_forest", "randomforest"):
        return RandomForestRegressor(
            random_state=params.get("random_state", 42),
            n_estimators=params.get("n_estimators", 100),
            max_depth=params.get("max_depth", 6),
            min_samples_split=params.get("min_samples_split", 8),
            min_samples_leaf=params.get("min_samples_leaf", 4),
            n_jobs=1,
        )
    elif algo == "ridge":
        return Ridge(alpha=params.get("alpha", 1.0), random_state=params.get("random_state", 42))
    elif algo in ("decision_tree", "decisiontree"):
        return DecisionTreeRegressor(
            random_state=params.get("random_state", 42),
            max_depth=params.get("max_depth", 5),
            min_samples_split=params.get("min_samples_split", 10),
        )
    raise ValueError(f"Unsupported algorithm '{algorithm}'.")


def build_pipeline(algorithm: str, params: Dict[str, Any]) -> Pipeline:
    """Combine preprocessor and estimator into an atomic scikit-learn Pipeline."""
    return Pipeline([
        ("preprocessor", build_preprocessor()),
        ("estimator", create_model_estimator(algorithm, params)),
    ])


def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Calculate regression metrics: RMSE, MAE, MSE, R², and Pearson correlation."""
    rmse = float(root_mean_squared_error(y_true, y_pred))
    mae = float(mean_absolute_error(y_true, y_pred))
    mse = float(mean_squared_error(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))

    if np.std(y_pred) > 1e-6 and np.std(y_true) > 1e-6:
        corr, _ = pearsonr(y_true, y_pred)
        pearson_val = float(corr)
    else:
        pearson_val = 0.0

    return {
        "rmse": round(rmse, 4),
        "mae": round(mae, 4),
        "mse": round(mse, 4),
        "r2": round(r2, 4),
        "pearson_corr": round(pearson_val, 4),
    }


def train_single_model(
    df: pd.DataFrame,
    algorithm: str = "gradient_boosting",
    params: Dict[str, Any] = None,
    test_size: float = 0.2,
    random_state: int = 42,
) -> Tuple[Any, Dict[str, Any]]:
    """Train pipeline, evaluate against holdout split, and return report."""
    if params is None:
        params = {}

    X = df[FEATURES]
    y = df[TARGET_FEATURE].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )

    pipeline = build_pipeline(algorithm, params)
    pipeline.fit(X_train, y_train)

    train_preds = pipeline.predict(X_train)
    test_preds = pipeline.predict(X_test)

    report = {
        "algorithm": algorithm,
        "hyperparameters": params,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "train_metrics": calculate_metrics(y_train, train_preds),
        "test_metrics": calculate_metrics(y_test, test_preds),
    }

    return pipeline, report


def run_benchmark_suite(
    df: pd.DataFrame,
    algorithms: Tuple[str, ...] = ("gradient_boosting", "random_forest", "ridge", "decision_tree"),
) -> Dict[str, Dict[str, Any]]:
    """Execute training on all candidate algorithms and collect comparative evaluations."""
    results = {}
    for algo in algorithms:
        _, report = train_single_model(df, algorithm=algo)
        results[algo] = report
    return results
