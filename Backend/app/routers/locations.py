"""Find Location: list and search store locations."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from ..database import get_db
from ..models import Location
from ..schemas import LocationOut

router = APIRouter(prefix="/locations", tags=["locations"])


def _location_to_out(loc) -> LocationOut:
    """Build LocationOut including is_active from related store."""
    return LocationOut(
        id=loc.id,
        store_id=loc.store_id,
        store_name=loc.store_name,
        address=loc.address,
        area=loc.area,
        city=loc.city,
        state=loc.state,
        pincode=loc.pincode,
        phone=loc.phone,
        opening_time=loc.opening_time,
        closing_time=loc.closing_time,
        is_active=loc.store.is_active if loc.store is not None else True,
    )


@router.get("", response_model=list[LocationOut])
def get_locations(db: Session = Depends(get_db)):
    """Return all store locations."""
    locations = (
        db.query(Location)
        .options(joinedload(Location.store))
        .order_by(Location.city, Location.store_name)
        .all()
    )
    return [_location_to_out(loc) for loc in locations]


@router.get("/search", response_model=list[LocationOut])
def search_locations(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
):
    """Search stores by partial match on store_name, city, area, pincode (case-insensitive)."""
    term = f"%{q.strip()}%"
    locations = (
        db.query(Location)
        .options(joinedload(Location.store))
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
    return [_location_to_out(loc) for loc in locations]
