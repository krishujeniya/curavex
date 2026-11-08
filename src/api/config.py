"""API configuration and rate tier settings."""
from typing import List, Dict

API_V1_PREFIX: str = "/api/v1"
PROJECT_NAME: str = "Agyos Clinical Drug Effectiveness MLOps Platform"
VERSION: str = "2.0.0"
DESCRIPTION: str = "Enterprise MLOps SaaS for Clinical Drug Response Regression & Model Governance"

ALLOWED_CORS_ORIGINS: List[str] = ["*"]

TIERS: Dict[str, Dict[str, int]] = {
    "free": {"rpm": 60, "monthly_limit": 10000},
    "standard": {"rpm": 300, "monthly_limit": 100000},
    "enterprise": {"rpm": 1200, "monthly_limit": 1000000},
}

DEFAULT_API_KEYS: Dict[str, Dict[str, str]] = {
    "live_agyos_clinical_enterprise_key_99x": {
        "tier": "enterprise",
        "name": "Clinical Trial Operations (Production)",
    },
    "live_agyos_standard_key_44b": {
        "tier": "standard",
        "name": "Biostatistical Research Team",
    },
    "demo_key_public_guest": {
        "tier": "free",
        "name": "Public Sandbox Guest",
    },
}
