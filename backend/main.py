"""Backend application entrypoint re-exporting from src.api.main for compatibility."""
from src.api.main import app, lifespan

__all__ = ["app", "lifespan"]
