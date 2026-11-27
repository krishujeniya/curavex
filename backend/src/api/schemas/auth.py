"""API Key schemas."""
from pydantic import BaseModel, Field


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    tier: str = Field(default="standard")


class ApiKeyResponse(BaseModel):
    api_key: str
    name: str
    tier: str
    requests_per_minute: int
    monthly_limit: int


class SignUpRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)


class SignInRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=254)
    password: str = Field(..., min_length=1, max_length=128)


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    tier: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic


class SignOutResponse(BaseModel):
    status: str = "signed_out"
