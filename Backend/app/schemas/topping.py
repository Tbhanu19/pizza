from pydantic import BaseModel


class ToppingOut(BaseModel):
    id: int
    name: str
    type: str 

    class Config:
        from_attributes = True


class ToppingList(BaseModel):
    toppings: list[ToppingOut]
