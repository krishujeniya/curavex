"""Model Registry managing serialized artifacts, semantic versions, and atomic promotions."""
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import joblib

from src.config import MODELS_DIR


class ModelRegistry:
    """Governance registry for serialized model artifacts and metadata."""

    def __init__(self, registry_dir: Path = MODELS_DIR):
        self.registry_dir = registry_dir
        try:
            self.registry_dir.mkdir(parents=True, exist_ok=True)
        except OSError:
            # Serverless read-only filesystem fallback (e.g., Vercel / AWS Lambda)
            self.registry_dir = Path("/tmp/models/registry")
            self.registry_dir.mkdir(parents=True, exist_ok=True)
            if (MODELS_DIR / "registry.json").exists():
                try:
                    import shutil
                    shutil.copytree(MODELS_DIR, self.registry_dir, dirs_exist_ok=True)
                except Exception:
                    pass

        self.metadata_file = self.registry_dir / "registry.json"
        self._ensure_metadata_file()

    def _ensure_metadata_file(self) -> None:
        if not self.metadata_file.exists():
            with open(self.metadata_file, "w", encoding="utf-8") as f:
                json.dump({"models": [], "active_production_id": None}, f, indent=2)

    def _load_metadata(self) -> Dict[str, Any]:
        with open(self.metadata_file, "r", encoding="utf-8") as f:
            return json.load(f)

    def _save_metadata(self, data: Dict[str, Any]) -> None:
        with open(self.metadata_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def register_model(
        self,
        pipeline: Any,
        algorithm: str,
        version: str,
        metrics: Dict[str, Any],
        hyperparameters: Dict[str, Any],
        status: str = "STAGING",
        description: str = "",
    ) -> Dict[str, Any]:
        """Serialize pipeline and append record to registry."""
        model_id = f"{algorithm}-{version}-{uuid.uuid4().hex[:6]}"
        artifact_path = self.registry_dir / f"{model_id}.joblib"
        joblib.dump(pipeline, artifact_path)

        record = {
            "model_id": model_id,
            "algorithm": algorithm,
            "version": version,
            "status": status,
            "description": description,
            "artifact_path": str(artifact_path),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "metrics": metrics,
            "hyperparameters": hyperparameters,
        }

        meta = self._load_metadata()
        if status == "PRODUCTION":
            for m in meta["models"]:
                if m.get("status") == "PRODUCTION":
                    m["status"] = "ARCHIVED"
            meta["active_production_id"] = model_id

        meta["models"].append(record)
        self._save_metadata(meta)
        return record

    def list_models(self) -> List[Dict[str, Any]]:
        """Return all models ordered by creation timestamp."""
        meta = self._load_metadata()
        return sorted(meta["models"], key=lambda m: m["created_at"], reverse=True)

    def get_model_entry(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve model metadata by model identifier."""
        meta = self._load_metadata()
        for item in meta["models"]:
            if item["model_id"] == model_id:
                return item
        return None

    def promote_model(self, model_id: str, target_stage: str = "PRODUCTION") -> Optional[Dict[str, Any]]:
        """Atomically transition model lifecycle stage."""
        meta = self._load_metadata()
        found = False
        for item in meta["models"]:
            if item["model_id"] == model_id:
                item["status"] = target_stage
                item["updated_at"] = datetime.now(timezone.utc).isoformat()
                found = True
            elif target_stage == "PRODUCTION" and item["status"] == "PRODUCTION":
                item["status"] = "ARCHIVED"

        if not found:
            return None

        if target_stage == "PRODUCTION":
            meta["active_production_id"] = model_id
        elif meta.get("active_production_id") == model_id:
            meta["active_production_id"] = None

        self._save_metadata(meta)
        return self.get_model_entry(model_id)

    def load_active_model(self) -> Tuple[Optional[Any], Optional[Dict[str, Any]]]:
        """Load currently active PRODUCTION pipeline artifact and metadata."""
        meta = self._load_metadata()
        active_id = meta.get("active_production_id")
        if not active_id:
            staging = [m for m in meta["models"] if m["status"] == "STAGING"]
            if not staging:
                return None, None
            active_id = staging[0]["model_id"]

        entry = self.get_model_entry(active_id)
        if not entry:
            return None, None

        artifact_file = Path(entry["artifact_path"])
        if not artifact_file.exists():
            # Resolve relative to active registry_dir or standard models location
            candidate = self.registry_dir / artifact_file.name
            if candidate.exists():
                artifact_file = candidate
            elif (MODELS_DIR / artifact_file.name).exists():
                artifact_file = MODELS_DIR / artifact_file.name
            else:
                return None, None

        pipeline = joblib.load(artifact_file)
        return pipeline, entry
