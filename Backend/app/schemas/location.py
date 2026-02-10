from pydantic import BaseModel
from typing import Optional


class LocationOut(BaseModel):
    id: int
    store_name: str
    address: str
    area: Optional[str] = None
    city: str
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
   

    class Config:
        from_attributes = True
