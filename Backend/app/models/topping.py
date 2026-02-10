"""Topping model for customization options (crusts, sauces, cheese, meats, veggies)."""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from ..database import Base


class Topping(Base):
    __tablename__ = "toppings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  

    pizza_toppings = relationship("PizzaTopping", back_populates="topping")
