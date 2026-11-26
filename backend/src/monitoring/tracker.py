"""Real-time telemetry tracker, latency percentiles, and inference audit logger."""
import json
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

from src.config import LOGS_DIR


class InferenceTracker:
    """Collects inference telemetry, latency distributions, and audit trails."""

    def __init__(self, log_dir: Path = LOGS_DIR, buffer_size: int = 1000):
        self.log_file = log_dir / "inference_audit.jsonl"
        self.buffer: deque = deque(maxlen=buffer_size)
        self.latencies: deque = deque(maxlen=buffer_size)
        self.start_time = time.time()
        self.total_requests = 0
        self.total_errors = 0
        self._load_recent_logs()

    def _load_recent_logs(self) -> None:
        if self.log_file.exists():
            try:
                with open(self.log_file, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.strip():
                            record = json.loads(line)
                            self.buffer.append(record)
                            if "latency_ms" in record:
                                self.latencies.append(record["latency_ms"])
                            self.total_requests += 1
            except Exception:
                pass

    def log_inference(
        self,
        model_id: str,
        input_data: Dict[str, Any],
        predicted_score: float,
        effectiveness: str,
        latency_ms: float,
        client_ip: Optional[str] = None,
        is_batch: bool = False,
    ) -> Dict[str, Any]:
        """Record an inference event."""
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "model_id": model_id,
            "input": input_data,
            "predicted_score": round(predicted_score, 2),
            "effectiveness": effectiveness,
            "latency_ms": round(latency_ms, 2),
            "client_ip": client_ip or "internal",
            "is_batch": is_batch,
        }

        self.buffer.append(record)
        self.latencies.append(latency_ms)
        self.total_requests += 1

        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")
        except Exception:
            pass

        return record

    def log_error(self, error_message: str, input_data: Optional[Dict[str, Any]] = None) -> None:
        """Track failed requests."""
        self.total_errors += 1
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": error_message,
            "input": input_data,
            "status": "FAILED",
        }
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")
        except Exception:
            pass

    def get_telemetry_metrics(self) -> Dict[str, Any]:
        """Compute latency percentiles, throughput, and error rates."""
        lat_arr = np.array(list(self.latencies)) if self.latencies else np.array([0.0])
        uptime_sec = max(time.time() - self.start_time, 1.0)
        throughput_rpm = round((self.total_requests / uptime_sec) * 60, 2)

        distribution = {"Low": 0, "Medium": 0, "High": 0}
        for item in self.buffer:
            eff = item.get("effectiveness")
            if eff in distribution:
                distribution[eff] += 1

        return {
            "total_inferences": self.total_requests,
            "total_errors": self.total_errors,
            "error_rate_pct": round((self.total_errors / max(self.total_requests, 1)) * 100, 2),
            "throughput_req_per_min": throughput_rpm,
            "latency_ms": {
                "avg": round(float(np.mean(lat_arr)), 2),
                "p50": round(float(np.percentile(lat_arr, 50)), 2),
                "p95": round(float(np.percentile(lat_arr, 95)), 2),
                "p99": round(float(np.percentile(lat_arr, 99)), 2),
            },
            "effectiveness_distribution": distribution,
            "uptime_seconds": round(uptime_sec, 1),
        }

    def get_recent_logs(self, limit: int = 50, filter_eff: Optional[str] = None) -> List[Dict[str, Any]]:
        """Query recent inference logs with optional filtering."""
        logs = list(self.buffer)
        if filter_eff:
            logs = [l for l in logs if l.get("effectiveness") == filter_eff]
        return list(reversed(logs))[:limit]
