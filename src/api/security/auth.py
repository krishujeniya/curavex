"""Security authentication and token quota checks."""
import time
from collections import defaultdict
from typing import Optional, Dict
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials

from src.api.config import DEFAULT_API_KEYS, TIERS

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)

_request_buckets: Dict[str, list] = defaultdict(list)
_active_api_keys: Dict[str, Dict[str, str]] = dict(DEFAULT_API_KEYS)


def get_api_key_record(token: str) -> Optional[Dict[str, str]]:
    return _active_api_keys.get(token)


def register_new_key(key: str, tier: str, name: str) -> Dict[str, str]:
    record = {"tier": tier, "name": name}
    _active_api_keys[key] = record
    return record


def list_registered_keys() -> Dict[str, Dict[str, str]]:
    return _active_api_keys


def check_rate_limit(key: str, tier: str) -> None:
    now = time.time()
    rpm_limit = TIERS.get(tier, TIERS["free"])["rpm"]
    window = 60.0

    bucket = _request_buckets[key]
    _request_buckets[key] = [t for t in bucket if now - t < window]

    if len(_request_buckets[key]) >= rpm_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded for tier '{tier}'. Limit: {rpm_limit} req/min.",
        )
    _request_buckets[key].append(now)


async def verify_api_key(
    header_key: Optional[str] = Security(api_key_header),
    bearer_creds: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> Dict[str, str]:
    token = header_key or (bearer_creds.credentials if bearer_creds else None)
    if not token:
        token = "demo_key_public_guest"

    record = get_api_key_record(token)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired API Key provided.",
        )

    check_rate_limit(token, record["tier"])
    return {"api_key": token, **record}
