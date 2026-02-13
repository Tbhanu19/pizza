from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Cart, CartItem, Order, User, Store, Location
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
    
   
    resolved_store_id = body.store_id
    store = db.query(Store).filter(Store.id == body.store_id).first()
    
    if not store:
        
        location_data = body.location or {}
        store_name = location_data.get("store_name") or location_data.get("name")
        
        
        if store_name:
            location = db.query(Location).filter(Location.store_name == store_name).first()
            if location and location.store_id:
               
                store = db.query(Store).filter(Store.id == location.store_id).first()
                if store:
                    resolved_store_id = store.id
        
        
        if not store and store_name:
            
            def normalize_store_name(name):
                normalized = ' '.join(name.strip().upper().split())
                normalized = normalized.replace(' - ', '-').replace(' -', '-').replace('- ', '-')
                return normalized
            
            store_name_clean = normalize_store_name(store_name)
           
            all_stores = db.query(Store).all()
            for s in all_stores:
                if s.name:
                    s_name_clean = normalize_store_name(s.name)
                    if s_name_clean == store_name_clean:
                        store = s
                        break
                   
                    if store_name_clean in s_name_clean or s_name_clean in store_name_clean:
                        store = s
                        break
            
            if store:
                resolved_store_id = store.id
            else:
               
                store = Store(
                    name=store_name.strip(),
                    address=location_data.get("address"),
                    city=location_data.get("city"),
                    state=location_data.get("state"),
                    pincode=location_data.get("pincode"),
                    phone=location_data.get("phone"),
                    is_active=True,
                )
                db.add(store)
                db.commit()
                db.refresh(store)
                
                
                from ..services.admin_service import link_locations_to_store
                link_locations_to_store(db, store)
                db.commit()
                
                resolved_store_id = store.id
        elif not store:
            raise HTTPException(status_code=400, detail="Invalid store_id and no location data provided.")
    
    if not store:
        raise HTTPException(status_code=400, detail="Invalid store_id. Store not found.")
    
    order = Order(
        session_id=f"user_{current_user.id}",
        user_id=current_user.id,
        store_id=resolved_store_id,
        order_data=order_data,
        total=total,
        location=body.location if body.location else None,
        status="PENDING",
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
    
    
    customer_name = None
    customer_email = None
    customer_phone = None
    address = None
    city = None
    zipCode = None
    
    if order.order_data and isinstance(order.order_data, dict):
        delivery = order.order_data.get("delivery")
        if delivery and isinstance(delivery, dict):
            customer_name = delivery.get("name")
            customer_email = delivery.get("email")
            customer_phone = delivery.get("phone")
            address = delivery.get("address")
            city = delivery.get("city")
            zipCode = delivery.get("zipCode")
    
    return OrderOut(
        id=order.id,
        session_id=order.session_id,
        user_id=order.user_id,
        store_id=order.store_id,
        total=order.total,
        order_data=order.order_data or {},
        items=items,
        location=order.location,
        status=order.status,
        accepted_at=order.accepted_at,
        rejected_at=order.rejected_at,
        updated_at=order.updated_at,
        created_at=order.created_at,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        address=address,
        city=city,
        zipCode=zipCode,
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
