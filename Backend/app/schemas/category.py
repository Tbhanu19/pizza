<<<<<<< HEAD
from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
=======
from pydantic import BaseModel


class CategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True
>>>>>>> 9ea165a1704de24445771a5c551b07ef0ba8c933
