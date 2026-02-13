from sqlalchemy import Column, Integer, Float, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id", ondelete="SET NULL"), nullable=True, index=True)
    order_data = Column(JSON, nullable=False)
    total = Column(Float, default=0.0, nullable=False)
    location = Column(JSON, nullable=True)
    status = Column(String(50), default="PENDING", nullable=False)
    payment_intent_id = Column(String(255), nullable=True, index=True)
    payment_status = Column(String(50), default="pending", nullable=False)
    payment_method = Column(String(50), nullable=True)
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="orders")
    store = relationship("Store", back_populates="orders")
