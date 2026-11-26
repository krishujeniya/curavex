"""FastAPI application factory with API v1 routes and frontend serving."""
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Any

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from src.api.v1 import api_v1_router
from src.api.config import (
    API_V1_PREFIX,
    PROJECT_NAME,
    VERSION,
    DESCRIPTION,
    ALLOWED_CORS_ORIGINS,
)
from src.api.security.auth import verify_api_key
from src.models.registry import ModelRegistry
from src.monitoring.tracker import InferenceTracker

BASE_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = BASE_DIR.parent
FRONTEND_OUT_DIR = REPO_ROOT / "frontend" / "out"
FRONTEND_DIR = FRONTEND_OUT_DIR if FRONTEND_OUT_DIR.exists() else REPO_ROOT / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    registry = ModelRegistry()
    _, meta = registry.load_active_model()
    app.state.active_model_id = meta["model_id"] if meta else None
    yield
    InferenceTracker().flush()


app = FastAPI(
    title=PROJECT_NAME,
    version=VERSION,
    description=DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_v1_router, prefix=API_V1_PREFIX)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    if request.url.path.startswith("/api/v1/api-keys") or request.url.path.startswith("/api/v1/monitoring/logs"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": "Internal server error."})


@app.get("/healthz", tags=["System Health"])
@app.get("/api/v1/health", tags=["System Health"])
async def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "version": VERSION,
    }


@app.get("/metrics", tags=["System Health"])
async def system_metrics(auth: Dict[str, str] = Depends(verify_api_key)) -> Dict[str, Any]:
    tracker = InferenceTracker()
    return tracker.get_telemetry_metrics()


@app.get("/", tags=["System Health"])
@app.get("/dashboard", tags=["System Health"])
async def serve_root():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {
        "name": PROJECT_NAME,
        "version": VERSION,
        "status": "healthy",
        "docs": "/docs",
        "health": "/healthz",
        "api_v1": f"{API_V1_PREFIX}/predict",
    }


if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
    if (FRONTEND_DIR / "_next").exists():
        app.mount("/_next", StaticFiles(directory=str(FRONTEND_DIR / "_next")), name="next_assets")
    if (FRONTEND_DIR / "css").exists():
        app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    if (FRONTEND_DIR / "js").exists():
        app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")
    if (FRONTEND_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")
