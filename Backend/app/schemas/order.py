from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Any


class CheckoutIn(BaseModel):
    name: str
    email: str
    phone: str
    address: str
    city: str
    zipCode: str
    paymentMethod: str = "card"
    location: Optional[dict[str, Any]] = None  


class CheckoutOut(BaseModel):
    id: int
    total: float


class OrderItemOut(BaseModel):
    """Single line in an order with product name."""
    product_name: str
    quantity: int
    unit_price: float


class OrderOut(BaseModel):
    id: int
    session_id: Optional[str] = None
    total: float
    order_data: dict
    items: list[OrderItemOut] = []
    location: Optional[dict] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
