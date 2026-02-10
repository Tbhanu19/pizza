<<<<<<< HEAD
from pydantic import BaseModel
from typing import Optional


class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    size: Optional[str] = None
    sauce: Optional[str] = None
    image: Optional[str] = None
    category_id: int
    type: str
    base_price: float = 0.0

    class Config:
        from_attributes = True


class ProductList(BaseModel):
    products: list[ProductOut]
=======
from pydantic import BaseModel
from typing import Optional


class ProductOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    size: Optional[str] = None
    sauce: Optional[str] = None
    image: Optional[str] = None
    category_id: int
    type: str
    base_price: float = 0.0

    class Config:
        from_attributes = True


class ProductList(BaseModel):
    products: list[ProductOut]
>>>>>>> 9ea165a1704de24445771a5c551b07ef0ba8c933
