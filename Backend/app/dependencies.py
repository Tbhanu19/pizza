from typing import Annotated
from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .database import get_db
from .config import SESSION_HEADER
from .models import User
from .services.auth_service import decode_access_token

security = HTTPBearer(auto_error=False)


def get_session_id(x_session_id: Annotated[str | None, Header(alias=SESSION_HEADER)] = None) -> str:
    if not x_session_id or not x_session_id.strip():
        raise HTTPException(status_code=400, detail="Missing session id. Send X-Session-Id header.")
    return x_session_id.strip()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization Bearer token required")
    token = credentials.credentials
    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
