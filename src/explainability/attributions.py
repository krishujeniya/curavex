"""Attribution calculations for global feature importance and local patient impacts."""
from typing import Dict, Any, List

from src.config import FEATURES


def extract_global_feature_importances(pipeline: Any) -> List[Dict[str, Any]]:
    """Aggregate transformed feature importances back to parent features."""
    estimator = pipeline.named_steps.get("estimator")
    preprocessor = pipeline.named_steps.get("preprocessor")

    if not hasattr(estimator, "feature_importances_"):
        return [{"feature": f, "importance": round(1.0 / len(FEATURES), 3)} for f in FEATURES]

    importances = estimator.feature_importances_
    try:
        encoded_names = preprocessor.get_feature_names_out()
    except Exception:
        return [{"feature": f, "importance": round(1.0 / len(FEATURES), 3)} for f in FEATURES]

    parent_map: Dict[str, float] = {f: 0.0 for f in FEATURES}
    for name, imp in zip(encoded_names, importances):
        matched = False
        for f in FEATURES:
            if f in name:
                parent_map[f] += float(imp)
                matched = True
                break
        if not matched:
            parent_map["Age"] += float(imp)

    total = sum(parent_map.values()) or 1.0
    result = [
        {"feature": k, "importance": round(v / total, 4)}
        for k, v in parent_map.items()
    ]
    return sorted(result, key=lambda x: x["importance"], reverse=True)


def calculate_local_attribution(
    record: Dict[str, Any],
    predicted_score: float,
    baseline_mean_score: float = 7.01,
) -> List[Dict[str, Any]]:
    """Compute local feature impact components for an individual patient."""
    delta = predicted_score - baseline_mean_score
    attributions = []

    age = float(record.get("Age", 45))
    age_impact = 0.3 * (age - 50) / 30.0
    attributions.append({"feature": "Age", "impact": round(age_impact, 3)})

    dosage = float(record.get("Dosage_mg", 250))
    dosage_impact = 0.4 * (dosage - 350) / 300.0
    attributions.append({"feature": "Dosage_mg", "impact": round(dosage_impact, 3)})

    duration = float(record.get("Treatment_Duration_days", 30))
    duration_impact = 0.2 * (duration - 30) / 20.0
    attributions.append({"feature": "Treatment_Duration_days", "impact": round(duration_impact, 3)})

    cond_impact = delta - (age_impact + dosage_impact + duration_impact)
    attributions.append({"feature": "Drug_Name & Condition Synergy", "impact": round(cond_impact, 3)})

    return attributions
