"""User authentication endpoints: signup, signin, current user, and signout."""
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials

from src.api.schemas.auth import (
    AuthResponse,
    SignInRequest,
    SignOutResponse,
    SignUpRequest,
    UserPublic,
)
from src.api.security.auth import (
    TOKEN_TTL_SECONDS,
    authenticate_user,
    bearer_scheme,
    create_access_token,
    create_user,
    get_current_user,
    revoke_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _normalize_email(email: str) -> str:
    cleaned = email.strip().lower()
    if "@" not in cleaned or "." not in cleaned.split("@", 1)[1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )
    return cleaned


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignUpRequest) -> AuthResponse:
    email = _normalize_email(payload.email)
    user = create_user(name=payload.name.strip(), email=email, password=payload.password)
    token = create_access_token(user)
    return AuthResponse(
        access_token=token,
        expires_in=TOKEN_TTL_SECONDS,
        user=UserPublic(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            tier=user["tier"],
        ),
    )


@router.post("/signin", response_model=AuthResponse)
async def signin(payload: SignInRequest) -> AuthResponse:
    email = _normalize_email(payload.email)
    user = authenticate_user(email=email, password=payload.password)
    token = create_access_token(user)
    return AuthResponse(
        access_token=token,
        expires_in=TOKEN_TTL_SECONDS,
        user=UserPublic(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            tier=user["tier"],
        ),
    )


@router.get("/me", response_model=UserPublic)
async def read_current_user(user: Dict[str, Any] = Depends(get_current_user)) -> UserPublic:
    return UserPublic(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        tier=user["tier"],
    )


@router.post("/signout", response_model=SignOutResponse)
async def signout(
    bearer_creds: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
) -> SignOutResponse:
    if bearer_creds and bearer_creds.credentials:
        revoke_token(bearer_creds.credentials)
    return SignOutResponse()
