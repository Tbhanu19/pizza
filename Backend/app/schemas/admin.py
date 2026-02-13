"""Admin schemas for authentication and management."""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class AdminSignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    store_id: Optional[int] = None
    phone: Optional[str] = None


class AdminSignupWithStoreIn(BaseModel):
    """Signup: create store + admin. Always creates new store. Returns JWT."""
    store_name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    admin_name: str
    email: EmailStr
    password: str


class StoreCreateIn(BaseModel):
    """Store data for creating/finding stores."""
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None


class AdminLoginIn(BaseModel):
    """Login with email and password. Optionally provide store data to create/link store."""
    email: EmailStr
    password: str
    store: Optional[StoreCreateIn] = None


class AdminLoginByStoreIn(BaseModel):
    """Legacy: login with store_id (from stores table) and password."""
    store_id: int
    password: str


class AdminAuthOut(BaseModel):
    """Response for signup and email+password login."""
    access_token: str
    admin_name: str
    store_id: int


class AdminTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    first_login: bool = False
    message: Optional[str] = None


class AdminOut(BaseModel):
    id: int
    username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    store_id: Optional[int] = None
    role: str
    is_active: bool
    is_first_login: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class StoreCreateOut(BaseModel):
    """Returned once when store is created; includes auto-created admin credentials."""
    store_id: int
    store_name: str
    username: str
    password: str


class ChangePasswordIn(BaseModel):
    new_password: str


class AdminCompleteSetupIn(BaseModel):
    """Required profile data + new password after first login."""
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    new_password: str


class OrderStatusUpdateIn(BaseModel):
    status: str


class StoreOut(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminCreateIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    store_id: int
    phone: Optional[str] = None


class StoreMeUpdateIn(BaseModel):
    """Nested store fields for PATCH /admin/me."""
    store_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class StoreStatusUpdateIn(BaseModel):
    """Body for PATCH /admin/store (store status update)."""
    is_active: bool


class AdminMeUpdateIn(BaseModel):
    """Body for PATCH /admin/me (profile + store)."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    store: Optional[StoreMeUpdateIn] = None


class AdminMeOut(BaseModel):
    """Response for GET /admin/me: admin + store for profile page."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    store: Optional[StoreOut] = None
