"""Store location model for Find Location feature."""
from sqlalchemy import Column, Integer, String, Float
from ..database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=False)
    area = Column(String(100), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    phone = Column(String(30), nullable=True)
    opening_time = Column(String(10), nullable=True)
    closing_time = Column(String(10), nullable=True)
    
