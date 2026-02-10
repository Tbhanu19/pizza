<<<<<<< HEAD
"""Category model for menu sections."""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)

    products = relationship("Product", back_populates="category")
=======
"""Category model for menu sections."""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)

    products = relationship("Product", back_populates="category")
>>>>>>> 9ea165a1704de24445771a5c551b07ef0ba8c933
