from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Cart, CartItem, Product, User
from ..schemas import CartItemIn, CartItemOut, CartOut, CartUpdateIn
from ..dependencies import get_current_user

router = APIRouter(prefix="/cart", tags=["cart"])


def _get_or_create_cart(db: Session, user_id: int) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id, session_id=f"user_{user_id}")
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def _cart_item_to_out(item: CartItem) -> dict:
    product_name = None
    if item.product_id and item.product:
        product_name = item.product.name
    elif item.custom_data and isinstance(item.custom_data, dict):
        product_name = item.custom_data.get("name", "Custom Pizza")
    else:
        product_name = "Custom Pizza"

    out = {
        "id": item.id,
        "product_id": item.product_id,
        "product_name": product_name,
        "quantity": item.quantity,
        "unit_price": item.unit_price,
        "custom_data": item.custom_data,
        "menu_item": None,
    }
    if item.product_id and item.product:
        out["menu_item"] = {
            "id": item.product.id,
            "name": item.product.name,
            "price": item.unit_price,
            "image": item.product.image or "🍕",
        }
    elif item.custom_data and isinstance(item.custom_data, dict):
        out["menu_item"] = {
            "id": None,
            "name": item.custom_data.get("name", "Custom Pizza"),
            "price": item.unit_price,
            "image": item.custom_data.get("image", "🍕"),
        }
    return out


@router.get("", response_model=CartOut)
def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        return CartOut(items=[])
    items = (
        db.query(CartItem)
        .filter(CartItem.cart_id == cart.id)
        .options(joinedload(CartItem.product))
        .all()
    )
    return CartOut(items=[CartItemOut(**_cart_item_to_out(i)) for i in items])


@router.post("/add")
def add_to_cart(
    body: CartItemIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.product_id is not None:
        product = db.query(Product).filter(Product.id == body.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        unit_price = float(product.base_price)
        custom_data = body.custom_data
    else:
        if not body.custom_data or not isinstance(body.custom_data, dict):
            raise HTTPException(status_code=400, detail="custom_data required for custom pizza")
        unit_price = float(body.custom_data.get("price", 0))
        if unit_price < 0:
            raise HTTPException(status_code=400, detail="Invalid price")
        custom_data = body.custom_data

    cart = _get_or_create_cart(db, current_user.id)
    item = CartItem(
        cart_id=cart.id,
        product_id=body.product_id,
        quantity=body.quantity,
        unit_price=unit_price,
        custom_data=custom_data,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    
    item = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.id == item.id)
        .first()
    )
    return CartItemOut(**_cart_item_to_out(item))


@router.put("/update")
def update_cart_item(
    body: CartUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    item = db.query(CartItem).filter(
        CartItem.id == body.item_id,
        CartItem.cart_id == cart.id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    item.quantity = body.quantity
    db.commit()
    db.refresh(item)
    item = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.id == item.id)
        .first()
    )
    return CartItemOut(**_cart_item_to_out(item))


@router.delete("/remove/{item_id}")
def remove_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        return
    item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.cart_id == cart.id,
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return None


@router.delete("/clear")
def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        return
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    return None
