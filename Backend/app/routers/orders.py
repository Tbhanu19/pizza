from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Cart, CartItem, Order, User
from ..schemas import CheckoutIn, CheckoutOut, OrderOut, OrderItemOut
from ..dependencies import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/checkout", response_model=CheckoutOut)
def checkout(
    body: CheckoutIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=400, detail="Cart is empty")
    items = (
        db.query(CartItem)
        .filter(CartItem.cart_id == cart.id)
        .options(joinedload(CartItem.product))
        .all()
    )
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    total = sum(i.unit_price * i.quantity for i in items)
    order_data = {
        "delivery": body.model_dump(),
        "items": [
            {
                "id": i.id,
                "product_id": i.product_id,
                "quantity": i.quantity,
                "unit_price": i.unit_price,
                "custom_data": i.custom_data,
                "name": (i.product.name if i.product else (i.custom_data or {}).get("name", "Custom")),
            }
            for i in items
        ],
        "subtotal": total,
    }
    order = Order(
        session_id=f"user_{current_user.id}",
        user_id=current_user.id,
        order_data=order_data,
        total=total,
        location=body.location if body.location else None,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()

    return CheckoutOut(id=order.id, total=order.total)


def _order_to_out(order: Order) -> OrderOut:
    """Build OrderOut with items list (product names) from order_data."""
    items = []
    if order.order_data and isinstance(order.order_data, dict):
        for row in order.order_data.get("items") or []:
            if isinstance(row, dict):
                items.append(
                    OrderItemOut(
                        product_name=row.get("name", "Custom"),
                        quantity=int(row.get("quantity", 0)),
                        unit_price=float(row.get("unit_price", 0)),
                    )
                )
    return OrderOut(
        id=order.id,
        session_id=order.session_id,
        total=order.total,
        order_data=order.order_data or {},
        items=items,
        location=order.location,
        created_at=order.created_at,
    )


@router.get("", response_model=list[OrderOut])
def list_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_order_to_out(o) for o in orders]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_to_out(order)
