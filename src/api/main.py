"""FastAPI application factory with API v1 routes and frontend serving."""
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Dict, Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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
from src.models.registry import ModelRegistry
from src.monitoring.tracker import InferenceTracker

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    registry = ModelRegistry()
    _, meta = registry.load_active_model()
    app.state.active_model_id = meta["model_id"] if meta else None
    yield


app = FastAPI(
    title=PROJECT_NAME,
    version=VERSION,
    description=DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def vercel_rewrite_handler(request: Request, call_next):
    """Normalize request path when hosted behind Vercel serverless rewrites."""
    raw_path = request.scope.get("path", "")
    route_param = request.query_params.get("__route__")

    if route_param is not None and raw_path in ("/api/index.py", "/api/index", "/api", "/api/"):
        clean = "/" + route_param.lstrip("/")
        request.scope["path"] = clean
        request.scope["raw_path"] = clean.encode("utf-8")
    else:
        headers = request.headers
        matched = (
            headers.get("x-matched-path")
            or headers.get("x-forwarded-uri")
            or headers.get("x-vercel-matched-path")
        )
        if matched and raw_path in ("/api/index.py", "/api/index", "/api", "/api/"):
            clean = matched.split("?")[0]
            request.scope["path"] = clean
            request.scope["raw_path"] = clean.encode("utf-8")

    return await call_next(request)


app.include_router(api_v1_router, prefix=API_V1_PREFIX)


@app.get("/api/debug", tags=["System Health"])
async def debug_headers(request: Request) -> Dict[str, Any]:
    return {
        "url": str(request.url),
        "path": request.url.path,
        "scope_path": request.scope.get("path"),
        "headers": dict(request.headers),
    }


@app.get("/healthz", tags=["System Health"])
@app.get("/api/v1/health", tags=["System Health"])
async def health_check() -> Dict[str, Any]:
    registry = ModelRegistry()
    _, meta = registry.load_active_model()
    return {
        "status": "healthy",
        "version": VERSION,
        "active_model": meta["model_id"] if meta else "none",
    }


@app.get("/metrics", tags=["System Health"])
async def system_metrics() -> Dict[str, Any]:
    tracker = InferenceTracker()
    return tracker.get_telemetry_metrics()


@app.get("/api/index.py", tags=["System Health"])
async def debug_vercel_request(request: Request) -> Dict[str, Any]:
    return {
        "url": str(request.url),
        "path": request.scope.get("path"),
        "headers": dict(request.headers),
        "query": str(request.query_params),
    }


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
    if (FRONTEND_DIR / "css").exists():
        app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    if (FRONTEND_DIR / "js").exists():
        app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")
    if (FRONTEND_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")
