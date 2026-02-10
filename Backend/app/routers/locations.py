<<<<<<< HEAD
"""Find Location: list and search store locations."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Location
from ..schemas import LocationOut

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=list[LocationOut])
def get_locations(db: Session = Depends(get_db)):
    """Return all store locations."""
    return db.query(Location).order_by(Location.city, Location.store_name).all()


@router.get("/search", response_model=list[LocationOut])
def search_locations(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    """Search stores by partial match on store_name, city, area, pincode (case-insensitive)."""
    term = f"%{q.strip()}%"
    return (
        db.query(Location)
        .filter(
            or_(
                Location.store_name.ilike(term),
                Location.city.ilike(term),
                Location.area.ilike(term),
                Location.pincode.ilike(term),
            )
        )
        .order_by(Location.city, Location.store_name)
        .all()
    )
=======
"""Find Location: list and search store locations."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Location
from ..schemas import LocationOut

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=list[LocationOut])
def get_locations(db: Session = Depends(get_db)):
    """Return all store locations."""
    return db.query(Location).order_by(Location.city, Location.store_name).all()


@router.get("/search", response_model=list[LocationOut])
def search_locations(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    """Search stores by partial match on store_name, city, area, pincode (case-insensitive)."""
    term = f"%{q.strip()}%"
    return (
        db.query(Location)
        .filter(
            or_(
                Location.store_name.ilike(term),
                Location.city.ilike(term),
                Location.area.ilike(term),
                Location.pincode.ilike(term),
            )
        )
        .order_by(Location.city, Location.store_name)
        .all()
    )
>>>>>>> 9ea165a1704de24445771a5c551b07ef0ba8c933
