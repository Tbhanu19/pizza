"""Admin routes for store-based order management."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Admin, Order, Store
from ..schemas import (
    AdminSignupWithStoreIn,
    AdminLoginIn,
    AdminAuthOut,
    AdminTokenOut,
    AdminOut,
    AdminMeOut,
    AdminMeUpdateIn,
    OrderOut,
    OrderItemOut,
    OrderStatusUpdateIn,
    StoreCreateIn,
    StoreCreateOut,
    StoreOut,
    StoreStatusUpdateIn,
    ChangePasswordIn,
    AdminCompleteSetupIn,
    AdminLoginByStoreIn,
)
from ..schemas.auth import MessageOut
from ..dependencies import get_current_admin
from ..services.admin_service import (
    get_admin_by_email,
    get_admin_by_store_id,
    verify_password,
    create_access_token,
    create_admin,
    create_store_admin_auto,
    hash_password,
    ensure_store_exists,
    create_store,
    link_locations_to_store,
)

router = APIRouter(prefix="/admin", tags=["admin"])

VALID_STATUSES = {"PENDING", "CONFIRMED", "ACCEPTED", "REJECTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"}


@router.get("/stores", response_model=list[StoreOut])
def list_stores(db: Session = Depends(get_db)):
    """List all active stores (for admin login dropdown). No auth required."""
    return db.query(Store).filter(Store.is_active == True).order_by(Store.name).all()


@router.post("/stores", response_model=StoreCreateOut)
def create_store(body: StoreCreateIn, db: Session = Depends(get_db)):
    """
    Create a new store and auto-create an admin for it.
    Returns store_id, store_name, username (store_<id>), and plain password ONCE.
    """
    store = Store(
        name=body.name,
        address=body.address,
        city=body.city,
        state=body.state,
        pincode=body.pincode,
        phone=body.phone,
        is_active=True,
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    
    # Link matching locations to this store
    link_locations_to_store(db, store)
    db.commit()
    
    try:
        admin, plain_password = create_store_admin_auto(db, store.id, store.name)
    except ValueError as e:
        db.delete(store)
        db.commit()
        raise HTTPException(status_code=400, detail=str(e))
    return StoreCreateOut(
        store_id=store.id,
        store_name=store.name,
        username=admin.username,
        password=plain_password,
    )


@router.post("/signup", response_model=AdminAuthOut)
def admin_signup(body: AdminSignupWithStoreIn, db: Session = Depends(get_db)):
    """
    Create a new store and admin. No authentication checks - just adds data to tables.
    Always creates a new store (no searching for existing). Store ID is auto-generated.
    Authentication (email/password verification) happens during login.
    Returns JWT access_token, admin_name, store_id.
    """
    # No authentication checks - just add data to tables
    # Always create a new store with provided details (store_id auto-generated)
    store = Store(
        name=body.store_name,
        address=body.address,
        city=body.city,
        state=body.state,
        pincode=body.pincode,
        phone=body.phone,
        is_active=True,
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    
    # Link matching locations to this store
    link_locations_to_store(db, store)
    db.commit()
    
    # Create admin linked to the new store (password is hashed for storage)
    admin = create_admin(
        db=db,
        name=body.admin_name,
        email=body.email,
        password=body.password,
        store_id=store.id,
        phone=body.phone,
        role="STORE_ADMIN",
    )
    
    token = create_access_token(admin.id, store.id)
    return AdminAuthOut(
        access_token=token,
        admin_name=admin.name or body.admin_name,
        store_id=store.id,
    )


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
    
    # Extract customer details from order_data.delivery
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
        payment_intent_id=order.payment_intent_id,
        payment_status=order.payment_status,
        payment_method=order.payment_method,
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


@router.post("/login", response_model=AdminAuthOut)
def admin_login(body: AdminLoginIn, db: Session = Depends(get_db)):
    """
    Admin login - verifies email and password from admin database.
    Authentication happens here: checks if admin exists, is active, and password matches.
    Optionally provide store data - if provided, creates new store and links admin to it.
    Returns access_token, admin_name, store_id. JWT payload: admin_id, store_id, role=admin.
    """
    
    admin = get_admin_by_email(db, body.email)
    if not admin:
        raise HTTPException(
            status_code=401, 
            detail="Invalid email or password",
            headers={"X-Error-Type": "email"}
        )
    
    
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin account is inactive")
    
   
    if not verify_password(body.password, admin.password_hash):
        raise HTTPException(
            status_code=401, 
            detail="Invalid email or password",
            headers={"X-Error-Type": "password"}
        )
    
   
    if body.store:
       
        store = create_store(
            db=db,
            store_name=body.store.name,
            address=body.store.address,
            city=body.store.city,
            state=body.store.state,
            pincode=body.store.pincode,
            phone=body.store.phone,
        )
       
        admin.store_id = store.id
        db.commit()
        db.refresh(admin)
    else:
       
        store = ensure_store_exists(db, admin)
        if store is None:
            raise HTTPException(
                status_code=403,
                detail="Admin is not assigned to a store. Please provide store data in login request."
            )
        db.refresh(admin)
    
    token = create_access_token(admin.id, admin.store_id)
    return AdminAuthOut(
        access_token=token,
        admin_name=admin.name or "",
        store_id=admin.store_id,
    )


@router.post("/login-by-store", response_model=AdminTokenOut)
def admin_login_by_store(body: AdminLoginByStoreIn, db: Session = Depends(get_db)):
    """
    Legacy: login with store_id and password. Returns first_login flag for complete-setup flow.
    If store doesn't exist, creates it from location data or minimal store.
    """
    store = db.query(Store).filter(Store.id == body.store_id, Store.is_active == True).first()
    if not store:
        
        admin = get_admin_by_store_id(db, body.store_id)
        if admin:
            
            store = ensure_store_exists(db, admin)
            if not store:
                raise HTTPException(status_code=404, detail="Store not found and could not be created")
        else:
            raise HTTPException(status_code=404, detail="Store not found")
    
    admin = get_admin_by_store_id(db, body.store_id)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not admin.is_active:
        raise HTTPException(status_code=403, detail="Admin account is inactive")
    if not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
  
    ensure_store_exists(db, admin)
    db.refresh(admin)
    
    token = create_access_token(admin.id, admin.store_id)
    if admin.is_first_login:
        return AdminTokenOut(
            access_token=token,
            first_login=True,
            message="COMPLETE_SETUP_REQUIRED",
        )
    return AdminTokenOut(access_token=token, first_login=False)


@router.get("/me", response_model=AdminMeOut)
def get_admin_me(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get current admin profile and store details for the profile page."""
    if current_admin.store_id is None:
        return AdminMeOut(
            name=current_admin.name,
            email=current_admin.email,
            phone=current_admin.phone,
            store=None,
        )
    store = db.query(Store).filter(Store.id == current_admin.store_id).first()
    return AdminMeOut(
        name=current_admin.name,
        email=current_admin.email,
        phone=current_admin.phone,
        store=store,
    )


@router.patch("/me", response_model=MessageOut)
def update_admin_me(
    body: AdminMeUpdateIn,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update current admin profile and/or store details. Store isolation enforced."""
    if body.name is not None:
        current_admin.name = body.name.strip() or None
    if body.email is not None:
        current_admin.email = body.email.strip() or None
    if body.phone is not None:
        current_admin.phone = body.phone.strip() or None

    if body.store is not None and current_admin.store_id is not None:
        store = db.query(Store).filter(Store.id == current_admin.store_id).first()
        if store:
            if body.store.store_name is not None:
                store.name = body.store.store_name.strip() or store.name
            if body.store.address is not None:
                store.address = body.store.address.strip() or None
            if body.store.city is not None:
                store.city = body.store.city.strip() or None
            if body.store.state is not None:
                store.state = body.store.state.strip() or None
            if body.store.pincode is not None:
                store.pincode = body.store.pincode.strip() or None
            if body.store.phone is not None:
                store.phone = body.store.phone.strip() or None
            if body.store.is_active is not None:
                store.is_active = body.store.is_active

    db.commit()
    return MessageOut(message="Profile updated successfully")


@router.patch("/store", response_model=MessageOut)
def update_store_status(
    body: StoreStatusUpdateIn,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update current admin's store status (activate/deactivate). Store isolation enforced."""
    if current_admin.store_id is None:
        raise HTTPException(status_code=403, detail="Admin is not assigned to a store")
    
    store = db.query(Store).filter(Store.id == current_admin.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    store.is_active = body.is_active
    db.commit()
    
    status_text = "activated" if body.is_active else "deactivated"
    return MessageOut(message=f"Store {status_text} successfully")


@router.put("/change-password", response_model=MessageOut)
def change_password(
    body: ChangePasswordIn,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Set new password and clear first-login flag. Requires JWT."""
    current_admin.password_hash = hash_password(body.new_password)
    current_admin.is_first_login = False
    db.commit()
    return MessageOut(message="Password changed successfully")


@router.put("/complete-setup", response_model=MessageOut)
def complete_setup(
    body: AdminCompleteSetupIn,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    After first login: collect name, email, phone and set new password.
    Call this when first_login is True. Updates profile and password, sets is_first_login=False.
    """
    current_admin.name = body.name.strip() or None
    current_admin.email = body.email.strip() if body.email and body.email.strip() else None
    current_admin.phone = body.phone.strip() if body.phone and body.phone.strip() else None
    current_admin.password_hash = hash_password(body.new_password)
    current_admin.is_first_login = False
    db.commit()
    return MessageOut(message="Setup complete. You can now use the dashboard.")


@router.get("/orders", response_model=list[OrderOut])
def list_admin_orders(
    status: str | None = Query(None, description="Filter by order status"),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Get orders for the admin's store."""
    if current_admin.store_id is None:
        raise HTTPException(status_code=403, detail="Admin must be assigned to a store")
    query = db.query(Order).filter(Order.store_id == current_admin.store_id)
    
    if status:
        status_upper = (status or "").strip().upper()
        if status_upper not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}")
        query = query.filter(Order.status == status_upper)
    
    orders = query.order_by(Order.created_at.desc()).all()
    return [_order_to_out(o) for o in orders]


@router.patch("/orders/{order_id}/accept")
def accept_order(
    order_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Accept an order. Sets status to accepted and accepted_at timestamp."""
    if current_admin.store_id is None:
        raise HTTPException(status_code=403, detail="Admin must be assigned to a store")
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.store_id == current_admin.store_id,
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if (order.status or "").upper() not in ("PENDING", "CONFIRMED"):
        raise HTTPException(status_code=400, detail=f"Order status is {order.status}, can only accept PENDING or CONFIRMED orders")
    
    order.status = "ACCEPTED"
    order.accepted_at = datetime.now(timezone.utc)
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    
    return _order_to_out(order)


@router.patch("/orders/{order_id}/reject")
def reject_order(
    order_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Reject an order. Sets status to rejected and rejected_at timestamp."""
    if current_admin.store_id is None:
        raise HTTPException(status_code=403, detail="Admin must be assigned to a store")
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.store_id == current_admin.store_id,
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if (order.status or "").upper() not in ("PENDING", "CONFIRMED"):
        raise HTTPException(status_code=400, detail=f"Order status is {order.status}, can only reject PENDING or CONFIRMED orders")
    
    order.status = "REJECTED"
    order.rejected_at = datetime.now(timezone.utc)
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    
    return _order_to_out(order)


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    body: OrderStatusUpdateIn,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update order status. Valid transitions:
    - accepted → preparing
    - preparing → ready
    - ready → out_for_delivery
    - out_for_delivery → delivered
    """
    new_status_upper = (body.status or "").strip().upper()
    if new_status_upper not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}")
    if current_admin.store_id is None:
        raise HTTPException(status_code=403, detail="Admin must be assigned to a store")
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.store_id == current_admin.store_id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    current_status_upper = (order.status or "").strip().upper()
    valid_transitions = {
        "ACCEPTED": {"PREPARING"},
        "PREPARING": {"READY"},
        "READY": {"OUT_FOR_DELIVERY"},
        "OUT_FOR_DELIVERY": {"DELIVERED"},
    }
    
    if current_status_upper in valid_transitions:
        if new_status_upper not in valid_transitions[current_status_upper]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from {order.status} to {body.status}. Valid transitions: {', '.join(valid_transitions[current_status_upper])}"
            )
    elif current_status_upper not in {"ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"}:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update status from {order.status}. Order must be ACCEPTED, PREPARING, READY, or OUT_FOR_DELIVERY."
        )
    
    order.status = new_status_upper
    order.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    
    return _order_to_out(order)


@router.patch("/orders/{order_id}", response_model=OrderOut)
def update_order(
    order_id: int,
    body: OrderStatusUpdateIn,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Generic endpoint to update order status. Handles all status transitions:
    - pending → accepted (sets accepted_at)
    - pending → rejected (sets rejected_at)
    - accepted → preparing
    - preparing → ready
    - ready → out_for_delivery
    - out_for_delivery → delivered
    """
    new_status_upper = (body.status or "").strip().upper()
    if new_status_upper not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(sorted(VALID_STATUSES))}")
    if current_admin.store_id is None:
        raise HTTPException(status_code=403, detail="Admin must be assigned to a store")
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.store_id == current_admin.store_id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    current_status = (order.status or "").strip().upper()
    
    if current_status in ("PENDING", "CONFIRMED"):
        if new_status_upper == "ACCEPTED":
            order.status = "ACCEPTED"
            order.accepted_at = datetime.now(timezone.utc)
            order.updated_at = datetime.now(timezone.utc)
        elif new_status_upper == "REJECTED":
            order.status = "REJECTED"
            order.rejected_at = datetime.now(timezone.utc)
            order.updated_at = datetime.now(timezone.utc)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from {current_status} to {body.status}. Valid transitions: ACCEPTED, REJECTED"
            )
    elif current_status == "ACCEPTED":
        if new_status_upper == "PREPARING":
            order.status = "PREPARING"
            order.updated_at = datetime.now(timezone.utc)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from ACCEPTED to {body.status}. Valid transition: PREPARING"
            )
    elif current_status == "PREPARING":
        if new_status_upper == "READY":
            order.status = "READY"
            order.updated_at = datetime.now(timezone.utc)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from PREPARING to {body.status}. Valid transition: READY"
            )
    elif current_status == "READY":
        if new_status_upper == "OUT_FOR_DELIVERY":
            order.status = "OUT_FOR_DELIVERY"
            order.updated_at = datetime.now(timezone.utc)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from READY to {body.status}. Valid transition: OUT_FOR_DELIVERY"
            )
    elif current_status == "OUT_FOR_DELIVERY":
        if new_status_upper == "DELIVERED":
            order.status = "DELIVERED"
            order.updated_at = datetime.now(timezone.utc)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot transition from OUT_FOR_DELIVERY to {body.status}. Valid transition: DELIVERED"
            )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update status from {current_status}. Order is in final state or invalid state."
        )
    
    db.commit()
    db.refresh(order)
    
    return _order_to_out(order)
