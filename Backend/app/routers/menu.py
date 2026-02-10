"""Menu APIs: categories, products, toppings, specialty."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..database import get_db
from ..models import Category, Product, Topping
from ..schemas import CategoryOut, ProductOut, ToppingOut

router = APIRouter(prefix="/menu", tags=["menu"])


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    rows = db.query(Category).order_by(Category.id).all()
    return [CategoryOut.model_validate(r) for r in rows]


@router.get("/products")
def get_products(
    category_id: int | None = Query(None),
    type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Product)
    if category_id is not None:
        q = q.filter(Product.category_id == category_id)
    if type is not None:
        q = q.filter(Product.type == type)
    rows = q.order_by(Product.id).all()
    return [ProductOut.model_validate(r) for r in rows]


@router.get("/toppings")
def get_toppings(
    type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Topping)
    if type is not None:
        q = q.filter(Topping.type == type)
    rows = q.order_by(Topping.type, Topping.name).all()
    return [ToppingOut.model_validate(r) for r in rows]


@router.get("/specialty")
def get_specialty(db: Session = Depends(get_db)):
    """Specialty category products (pizzas)."""
    cat = db.query(Category).filter(Category.name == "Specialty").first()
    if not cat:
        return []
    rows = db.query(Product).filter(
        and_(Product.category_id == cat.id, Product.type == "pizza")
    ).order_by(Product.id).all()
    return [ProductOut.model_validate(r) for r in rows]
