"""Many-to-many: products (specialty pizzas) and their default toppings."""
from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from ..database import Base


class PizzaTopping(Base):
    __tablename__ = "pizza_toppings"
    __table_args__ = (UniqueConstraint("product_id", "topping_id", name="uq_pizza_topping"),)

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    topping_id = Column(Integer, ForeignKey("toppings.id", ondelete="CASCADE"), nullable=False)

    product = relationship("Product", back_populates="default_toppings")
    topping = relationship("Topping", back_populates="pizza_toppings")
