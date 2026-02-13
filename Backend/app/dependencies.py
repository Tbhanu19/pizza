from typing import Annotated
from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .database import get_db
from .config import SESSION_HEADER
from .models import User, Admin
from .services.auth_service import decode_access_token
from .auth import decode_admin_token

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


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> Admin:
    """Get current admin from JWT token. Returns Admin with role and store_id."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization Bearer token required")
    token = credentials.credentials
    token_data = decode_admin_token(token)
    if token_data is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    admin_id = token_data.get("admin_id")
    admin = db.query(Admin).filter(Admin.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin account is inactive")
    
    
    if token_data.get("role") != "admin":
        raise HTTPException(status_code=401, detail="Token role mismatch")
    if admin.store_id != token_data.get("store_id"):
        raise HTTPException(status_code=401, detail="Token store_id mismatch")
    
    return admin


