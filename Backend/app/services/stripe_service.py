"""
Stripe PaymentIntent and webhook verification.
All Stripe API calls and signature verification live here.
"""
from __future__ import annotations

import stripe
from typing import Optional

from ..config import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET


def _ensure_stripe_configured() -> None:
    if not STRIPE_SECRET_KEY or not STRIPE_SECRET_KEY.startswith("sk_"):
        raise ValueError("STRIPE_SECRET_KEY is not configured or invalid")


def create_payment_intent(
    amount_cents: int,
    order_id: int,
    store_id: int,
    customer_email: Optional[str] = None,
    currency: str = "usd",
) -> dict:
    """
    Create a Stripe PaymentIntent. Amount must be computed server-side (from order).
    Returns dict with id and client_secret.
    """
    _ensure_stripe_configured()
    stripe.api_key = STRIPE_SECRET_KEY
    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency=currency,
        automatic_payment_methods={"enabled": True},
        metadata={
            "order_id": str(order_id),
            "store_id": str(store_id),
        },
        receipt_email=customer_email or "",
    )
    return {"id": intent.id, "client_secret": intent.client_secret}


def retrieve_payment_intent(payment_intent_id: str) -> Optional[dict]:
    """Retrieve a PaymentIntent by id. Returns None if not found or key not set."""
    if not STRIPE_SECRET_KEY or not STRIPE_SECRET_KEY.startswith("sk_"):
        return None
    stripe.api_key = STRIPE_SECRET_KEY
    try:
        return stripe.PaymentIntent.retrieve(payment_intent_id)
    except stripe.error.StripeError:
        return None


def verify_webhook_signature(payload: bytes, signature_header: Optional[str]) -> dict:
    """
    Verify Stripe webhook signature and return event dict.
    Raises ValueError for invalid payload, stripe.SignatureVerificationError for bad signature.
    """
    if not STRIPE_WEBHOOK_SECRET or not STRIPE_WEBHOOK_SECRET.startswith("whsec_"):
        raise ValueError("STRIPE_WEBHOOK_SECRET is not configured or invalid")
    if not signature_header:
        raise ValueError("Missing stripe-signature header")
    return stripe.Webhook.construct_event(
        payload, signature_header, STRIPE_WEBHOOK_SECRET
    )
