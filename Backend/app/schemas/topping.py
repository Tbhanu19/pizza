<<<<<<< HEAD
from pydantic import BaseModel


class ToppingOut(BaseModel):
    id: int
    name: str
    type: str 

    class Config:
        from_attributes = True


class ToppingList(BaseModel):
    toppings: list[ToppingOut]
=======
from pydantic import BaseModel


class ToppingOut(BaseModel):
    id: int
    name: str
    type: str 

    class Config:
        from_attributes = True


class ToppingList(BaseModel):
    toppings: list[ToppingOut]
>>>>>>> 9ea165a1704de24445771a5c551b07ef0ba8c933
