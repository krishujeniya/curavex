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
