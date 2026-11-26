"""Developer API Key management endpoints."""
import secrets
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from src.api.config import TIERS
from src.api.schemas.auth import ApiKeyCreateRequest, ApiKeyResponse
from src.api.security.auth import verify_api_key, register_new_key, list_registered_keys

router = APIRouter(prefix="/api-keys", tags=["Developer API Keys"])


@router.get("", response_model=List[ApiKeyResponse])
async def list_keys(auth: dict = Depends(verify_api_key)) -> List[ApiKeyResponse]:
    all_keys = list_registered_keys()
    result = []
    for k, meta in all_keys.items():
        tier = meta.get("tier", "standard")
        tier_cfg = TIERS.get(tier, TIERS["standard"])
        result.append(
            ApiKeyResponse(
                api_key=k,
                name=meta.get("name", "Generated Key"),
                tier=tier,
                requests_per_minute=tier_cfg["rpm"],
                monthly_limit=tier_cfg["monthly_limit"],
            )
        )
    return result


@router.post("/generate", response_model=ApiKeyResponse)
async def generate_key(
    payload: ApiKeyCreateRequest,
    auth: dict = Depends(verify_api_key),
) -> ApiKeyResponse:
    tier = payload.tier.lower().strip()
    if tier not in TIERS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid tier '{tier}'.")

    random_token = f"live_agyos_{secrets.token_urlsafe(16)}"
    register_new_key(random_token, tier, payload.name)
    tier_cfg = TIERS[tier]

    return ApiKeyResponse(
        api_key=random_token,
        name=payload.name,
        tier=tier,
        requests_per_minute=tier_cfg["rpm"],
        monthly_limit=tier_cfg["monthly_limit"],
    )
