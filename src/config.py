"""Centralized Cookiecutter configuration for data paths, schemas, and hyperparameters."""
import os
from pathlib import Path
from typing import List, Dict, Any

# Base Project Directories
BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"
DATA_RAW_DIR = DATA_DIR / "raw"
DATA_PROCESSED_DIR = DATA_DIR / "processed"
DATA_INTERIM_DIR = DATA_DIR / "interim"
DATA_EXTERNAL_DIR = DATA_DIR / "external"

MODELS_DIR = BASE_DIR / "models" / "registry"
LOGS_DIR = Path("/tmp/logs") if os.environ.get("VERCEL") else BASE_DIR / "logs"
REPORTS_DIR = BASE_DIR / "reports" / "figures"

# Canonical raw dataset path with fallback to root dataset
if (DATA_RAW_DIR / "real_drug_dataset.csv").exists():
    DATA_PATH = DATA_RAW_DIR / "real_drug_dataset.csv"
else:
    DATA_PATH = BASE_DIR / "real_drug_dataset.csv"

DATA_PROCESSED_PATH = DATA_PROCESSED_DIR / "cleaned_drug_dataset.csv"

# Ensure runtime directories exist safely on read-only serverless filesystems
for directory in [DATA_RAW_DIR, DATA_PROCESSED_DIR, DATA_INTERIM_DIR, DATA_EXTERNAL_DIR, MODELS_DIR, LOGS_DIR, REPORTS_DIR]:
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass

# Feature and Target Definitions
FEATURES: List[str] = [
    "Age",
    "Gender",
    "Condition",
    "Drug_Name",
    "Dosage_mg",
    "Treatment_Duration_days",
]

NUMERIC_FEATURES: List[str] = ["Age", "Dosage_mg", "Treatment_Duration_days"]
CATEGORICAL_FEATURES: List[str] = ["Gender", "Condition", "Drug_Name"]
TARGET_FEATURE: str = "Improvement_Score"

# Clinical Constraints
CLINICAL_BOUNDS: Dict[str, Dict[str, Any]] = {
    "Age": {"min": 1, "max": 120, "default": 45},
    "Dosage_mg": {"min": 5.0, "max": 2000.0, "default": 250.0},
    "Treatment_Duration_days": {"min": 1, "max": 365, "default": 30},
    "Improvement_Score": {"min": 0.0, "max": 10.0},
}

# Permitted Condition -> Drug Approval Map
CONDITION_DRUG_MAP: Dict[str, List[str]] = {
    "Depression": ["Bupropion", "Escitalopram", "Sertraline"],
    "Diabetes": ["Glipizide", "Metformin", "Insulin Glargine"],
    "Hypertension": ["Metoprolol", "Amlodipine", "Losartan"],
    "Infection": ["Ciprofloxacin", "Azithromycin", "Amoxicillin"],
    "Pain Relief": ["Paracetamol", "Ibuprofen", "Tramadol"],
}

ALLOWED_GENDERS: List[str] = ["Male", "Female"]
DRIFT_P_VALUE_THRESHOLD: float = 0.05
