"""API v1 router composition."""
from fastapi import APIRouter

from src.api.v1.predict import router as predict_router
from src.api.v1.models import router as models_router
from src.api.v1.monitoring import router as monitoring_router
from src.api.v1.metadata import router as metadata_router
from src.api.v1.api_keys import router as api_keys_router

api_v1_router = APIRouter()
api_v1_router.include_router(predict_router)
api_v1_router.include_router(models_router)
api_v1_router.include_router(monitoring_router)
api_v1_router.include_router(metadata_router)
api_v1_router.include_router(api_keys_router)
