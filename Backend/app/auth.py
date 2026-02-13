"""Admin JWT auth utilities: create and decode access tokens."""
from datetime import datetime, timezone, timedelta
from jose import JWTError, jwt

from .config import SECRET_KEY, ALGORITHM, ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES


def create_admin_access_token(admin_id: int, store_id: int) -> str:
    """Create JWT access token. Payload: admin_id, store_id, role='admin'. HS256, 24h expiry."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "admin_id": admin_id,
        "store_id": store_id,
        "role": "admin",
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_admin_token(token: str) -> dict | None:
    """Decode admin JWT. Returns dict with admin_id, store_id, role or None if invalid."""
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {
            "admin_id": int(data["admin_id"]),
            "store_id": data.get("store_id"),
            "role": data.get("role"),
        }
    except (JWTError, KeyError, TypeError, ValueError):
        return None
