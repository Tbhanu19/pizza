"""Product model: all sellable items (pizzas, chicken, drinks)."""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=True)
    size = Column(String(50), nullable=True) 
    sauce = Column(String(100), nullable=True)
    image = Column(String(20), nullable=True)  
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    type = Column(String(50), nullable=False)  
    base_price = Column(Float, default=0.0, nullable=False)

    category = relationship("Category", back_populates="products")
    default_toppings = relationship("PizzaTopping", back_populates="product")
