<<<<<<< HEAD
from pydantic import BaseModel, Field
from typing import Optional, Any


class CartItemIn(BaseModel):
    product_id: Optional[int] = None
    quantity: int = Field(ge=1, le=99)
    custom_data: Optional[dict[str, Any]] = None  


class CartUpdateIn(BaseModel):
    item_id: int
    quantity: int = Field(ge=1, le=99)


class CartItemOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: Optional[str] = None  
    quantity: int
    unit_price: float
    custom_data: Optional[dict] = None
    menu_item: Optional[dict] = None  

    class Config:
        from_attributes = True


class CartOut(BaseModel):
    items: list[CartItemOut]
=======
from pydantic import BaseModel, Field
from typing import Optional, Any


class CartItemIn(BaseModel):
    product_id: Optional[int] = None
    quantity: int = Field(ge=1, le=99)
    custom_data: Optional[dict[str, Any]] = None  


class CartUpdateIn(BaseModel):
    item_id: int
    quantity: int = Field(ge=1, le=99)


class CartItemOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: Optional[str] = None  
    quantity: int
    unit_price: float
    custom_data: Optional[dict] = None
    menu_item: Optional[dict] = None  

    class Config:
        from_attributes = True


class CartOut(BaseModel):
    items: list[CartItemOut]
>>>>>>> 9ea165a1704de24445771a5c551b07ef0ba8c933
