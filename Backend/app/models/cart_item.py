"""Cart item: product or custom pizza with optional custom_data JSON."""
from sqlalchemy import Column, Integer, Float, ForeignKey, String, JSON
from sqlalchemy.orm import relationship
from ..database import Base


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("cart.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, default=0.0, nullable=False)
    custom_data = Column(JSON, nullable=True)  

    cart = relationship("Cart", back_populates="items")
    product = relationship("Product")
