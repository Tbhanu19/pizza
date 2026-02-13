"""
Stripe PaymentIntent and webhook integration.
Amount is always computed server-side from the order. No duplicate order creation.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import stripe

from ..config import STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
from ..database import get_db
from ..models import Order
from ..schemas import CreatePaymentIntentIn, CreatePaymentIntentOut
from ..dependencies import get_current_user
from ..services.stripe_service import (
    create_payment_intent as stripe_create_payment_intent,
    retrieve_payment_intent,
    verify_webhook_signature,
)
from ..models import User

router = APIRouter(prefix="/payments", tags=["payments"])


def _order_amount_cents(order: Order) -> int:
    """Compute amount in cents from order (backend-only)."""
    total = float(order.total or 0)
    if total <= 0:
        return 0
    return int(round(total * 100))


def _customer_email_from_order(order: Order) -> str | None:
    if order.order_data and isinstance(order.order_data, dict):
        delivery = order.order_data.get("delivery")
        if isinstance(delivery, dict):
            return delivery.get("email")
    return None


@router.post("/create-payment-intent", response_model=CreatePaymentIntentOut)
def create_payment_intent(
    body: CreatePaymentIntentIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a Stripe PaymentIntent for an existing order.
    Amount is computed only from the order in the DB (never trusted from frontend).
    If the order already has a pending PaymentIntent, its client_secret is returned.
    """
    order = (
        db.query(Order)
        .filter(Order.id == body.order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.store_id is None:
        raise HTTPException(status_code=400, detail="Order has no store")

    amount_cents = _order_amount_cents(order)
    if amount_cents <= 0:
        raise HTTPException(status_code=400, detail="Order total must be greater than zero")

    if order.payment_intent_id and (order.payment_status or "").lower() == "pending":
        pi = retrieve_payment_intent(order.payment_intent_id)
        if pi and pi.get("status") in ("requires_payment_method", "requires_confirmation", "requires_action"):
            return CreatePaymentIntentOut(
                client_secret=pi["client_secret"],
                payment_intent_id=pi["id"],
                amount_cents=amount_cents,
            )
        elif pi and pi.get("status") == "succeeded":
            raise HTTPException(status_code=400, detail="Order is already paid")

    try:
        result = stripe_create_payment_intent(
            amount_cents=amount_cents,
            order_id=order.id,
            store_id=order.store_id,
            customer_email=_customer_email_from_order(order),
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail="Payment service is not configured")
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    order.payment_intent_id = result["id"]
    order.payment_status = "pending"
    order.updated_at = datetime.now(timezone.utc)
    db.commit()

    return CreatePaymentIntentOut(
        client_secret=result["client_secret"],
        payment_intent_id=result["id"],
        amount_cents=amount_cents,
    )


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe webhook: verify signature, then handle payment_intent.succeeded / payment_intent.payment_failed.
    Updates order payment_status and, on success, sets order status to CONFIRMED.
    """
    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    try:
        event = verify_webhook_signature(payload, signature)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "payment_intent.succeeded":
        pi = event["data"]["object"]
        order = (
            db.query(Order)
            .filter(Order.payment_intent_id == pi["id"])
            .first()
        )
        if order:
            order.payment_status = "paid"
            order.status = "CONFIRMED"
            order.updated_at = datetime.now(timezone.utc)
            if pi.get("payment_method") and STRIPE_SECRET_KEY:
                try:
                    stripe.api_key = STRIPE_SECRET_KEY
                    pm = stripe.PaymentMethod.retrieve(pi["payment_method"])
                    order.payment_method = (pm.get("type") or "card") if isinstance(pm, dict) else getattr(pm, "type", "card")
                except Exception:
                    order.payment_method = "card"
            else:
                order.payment_method = "card"
            db.commit()

    elif event["type"] == "payment_intent.payment_failed":
        pi = event["data"]["object"]
        order = (
            db.query(Order)
            .filter(Order.payment_intent_id == pi["id"])
            .first()
        )
        if order:
            order.payment_status = "failed"
            order.updated_at = datetime.now(timezone.utc)
            db.commit()

    return {"status": "ok"}


@router.get("/config")
def get_payment_config():
    """Return publishable key for Stripe.js (no secrets)."""
    return {"publishable_key": STRIPE_PUBLISHABLE_KEY or ""}
