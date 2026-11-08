"""Backend security alias re-exporting from src.api.security.auth."""
from src.api.security.auth import (
    verify_api_key,
    register_new_key,
    list_registered_keys,
    get_api_key_record,
    check_rate_limit,
)

__all__ = [
    "verify_api_key",
    "register_new_key",
    "list_registered_keys",
    "get_api_key_record",
    "check_rate_limit",
]
