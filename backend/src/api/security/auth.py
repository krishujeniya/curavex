"""Security authentication, user sessions, and O(1) sliding-window token quota checks."""
import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from collections import defaultdict, deque
from typing import Any, Deque, Dict, Optional
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials

from src.api.config import DEFAULT_API_KEYS, TIERS

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer_scheme = HTTPBearer(auto_error=False)

_request_buckets: Dict[str, Deque[float]] = defaultdict(deque)
_active_api_keys: Dict[str, Dict[str, str]] = dict(DEFAULT_API_KEYS)

_TOKEN_SECRET = os.getenv("CURAVEX_AUTH_SECRET", secrets.token_hex(32)).encode("utf-8")
_TOKEN_TTL_SECONDS = 86400  # 24 hours
_users_by_email: Dict[str, Dict[str, Any]] = {}
_revoked_tokens: set[str] = set()


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
    cutoff = now - 60.0

    bucket = _request_buckets[key]
    while bucket and bucket[0] <= cutoff:
        bucket.popleft()

    if len(bucket) >= rpm_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded for tier '{tier}'. Limit: {rpm_limit} req/min.",
        )
    bucket.append(now)


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


TOKEN_TTL_SECONDS = _TOKEN_TTL_SECONDS


def hash_password(password: str, salt: Optional[bytes] = None) -> str:
    salt_bytes = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_bytes, 120_000)
    return f"{base64.urlsafe_b64encode(salt_bytes).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_b64, digest_b64 = stored_hash.split("$", 1)
        salt_bytes = base64.urlsafe_b64decode(salt_b64.encode())
        expected = base64.urlsafe_b64decode(digest_b64.encode())
    except Exception:
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_bytes, 120_000)
    return hmac.compare_digest(actual, expected)


def create_user(name: str, email: str, password: str) -> Dict[str, Any]:
    if email in _users_by_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    user = {
        "id": f"usr_{secrets.token_hex(8)}",
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "tier": "free",
        "created_at": int(time.time()),
    }
    _users_by_email[email] = user
    return user


def authenticate_user(email: str, password: str) -> Dict[str, Any]:
    user = _users_by_email.get(email)
    if not user or not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    return user


def create_access_token(user: Dict[str, Any]) -> str:
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "tier": user["tier"],
        "exp": int(time.time()) + _TOKEN_TTL_SECONDS,
        "jti": secrets.token_hex(8),
    }
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode()
    sig = hmac.new(_TOKEN_SECRET, payload_b64.encode(), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode()
    return f"{payload_b64}.{sig_b64}"


def verify_access_token(token: str) -> Dict[str, Any]:
    if token in _revoked_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been signed out.",
        )
    try:
        payload_b64, sig_b64 = token.split(".", 1)
        expected_sig = hmac.new(_TOKEN_SECRET, payload_b64.encode(), hashlib.sha256).digest()
        actual_sig = base64.urlsafe_b64decode(sig_b64.encode())
        if not hmac.compare_digest(expected_sig, actual_sig):
            raise ValueError("Invalid signature")
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode()).decode())
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or malformed access token.",
        )
    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired.",
        )
    user = _users_by_email.get(payload.get("email", ""))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )
    return user


def revoke_token(token: str) -> None:
    _revoked_tokens.add(token)


async def get_current_user(
    bearer_creds: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
) -> Dict[str, Any]:
    if not bearer_creds or not bearer_creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )
    return verify_access_token(bearer_creds.credentials)
