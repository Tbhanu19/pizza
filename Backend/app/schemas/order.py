from datetime import datetime, timezone
from pydantic import BaseModel, field_serializer
from typing import Optional, Any


def _ensure_utc(dt: datetime | None) -> datetime | None:
    """Make datetime timezone-aware (UTC) for correct JSON serialization with Z."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class CheckoutIn(BaseModel):
    name: str
    email: str
    phone: str
    address: str
    city: str
    zipCode: str
    paymentMethod: str = "card"
    location: Optional[dict[str, Any]] = None
    store_id: int  


class CheckoutOut(BaseModel):
    id: int
    total: float


class CreatePaymentIntentIn(BaseModel):
    order_id: int


class CreatePaymentIntentOut(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount_cents: int


class OrderItemOut(BaseModel):
    """Single line in an order with product name."""
    product_name: str
    quantity: int
    unit_price: float


class OrderOut(BaseModel):
    id: int
    session_id: Optional[str] = None
    user_id: Optional[int] = None
    store_id: Optional[int] = None
    total: float
    order_data: dict
    items: list[OrderItemOut] = []
    location: Optional[dict] = None
    status: Optional[str] = None
    payment_intent_id: Optional[str] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    accepted_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
   
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    zipCode: Optional[str] = None

    @field_serializer("accepted_at", "rejected_at", "updated_at", "created_at")
    def _serialize_datetime_utc(self, dt: datetime | None) -> datetime | None:
        return _ensure_utc(dt)

    class Config:
        from_attributes = True
