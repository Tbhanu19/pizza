from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import SignupIn, LoginIn, UserOut, TokenOut, MessageOut, AuthUpdateIn
from ..services.auth_service import (
    get_user_by_email,
    create_user,
    verify_password,
    create_access_token,
)
from ..dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=MessageOut)
def signup(body: SignupIn, db: Session = Depends(get_db)):
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="User already exists")
    create_user(db, name=body.name, email=body.email, password=body.password, phone=body.phone)
    return MessageOut(message="Signup successful")


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = get_user_by_email(db, body.email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id)
    return TokenOut(
        access_token=token,
        user=UserOut(id=user.id, name=user.name, email=user.email, phone=user.phone),
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    body: AuthUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.name is not None:
        current_user.name = body.name
    if body.phone is not None:
        current_user.phone = body.phone or None
    db.commit()
    db.refresh(current_user)
    return current_user
