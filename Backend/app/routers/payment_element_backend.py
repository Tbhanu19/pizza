"""
Stripe Payment Element Integration - FastAPI Backend
Embedded payment form on your site (better UX)
"""

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import stripe
import os
from datetime import datetime
import json
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Numeric, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# ============= CONFIGURATION =============
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_your_key_here")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_your_webhook_secret")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

# ============= DATABASE SETUP =============
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Store(Base):
    __tablename__ = "stores"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, nullable=False)
    customer_email = Column(String(255))
    customer_name = Column(String(255))
    cart_items = Column(JSON)
    total_amount = Column(Numeric(10, 2))
    stripe_payment_intent_id = Column(String(255), unique=True)
    payment_status = Column(String(50), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ============= PYDANTIC MODELS =============
class CartItem(BaseModel):
    id: int
    name: str
    price: float
    quantity: int
    image_url: Optional[str] = None

class PaymentIntentRequest(BaseModel):
    store_id: int
    cart_items: List[CartItem]
    customer_email: Optional[EmailStr] = None
    customer_name: Optional[str] = None

class PaymentIntentResponse(BaseModel):
    client_secret: str
    order_id: int
    publishable_key: str

# ============= FASTAPI APP =============
app = FastAPI(title="E-commerce Stripe Payment Element")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= DATABASE DEPENDENCY =============
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============= HELPER FUNCTIONS =============
def calculate_total(cart_items: List[CartItem]) -> float:
    return sum(item.price * item.quantity for item in cart_items)

# ============= API ENDPOINTS =============

@app.get("/")
async def root():
    return {"message": "Stripe Payment Element API"}

@app.post("/api/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    request: PaymentIntentRequest,
    db: Session = Depends(get_db)
):
    """
    Create a PaymentIntent for embedded Payment Element
    This is called when the checkout page loads
    """
    try:
        # Calculate total
        total = calculate_total(request.cart_items)
        amount_cents = int(total * 100)  # Convert to cents
        
        # Create order in database first
        order = Order(
            store_id=request.store_id,
            customer_email=request.customer_email,
            customer_name=request.customer_name,
            cart_items=[item.dict() for item in request.cart_items],
            total_amount=total,
            payment_status='pending'
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        
        # Create PaymentIntent
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency='usd',
            automatic_payment_methods={
                'enabled': True,
            },
            metadata={
                'order_id': str(order.id),
                'store_id': str(request.store_id),
                'customer_email': request.customer_email or '',
                'customer_name': request.customer_name or '',
            },
            description=f'Order #{order.id} - {len(request.cart_items)} items',
        )
        
        # Update order with PaymentIntent ID
        order.stripe_payment_intent_id = payment_intent.id
        db.commit()
        
        # Get publishable key from environment
        publishable_key = os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_your_key_here")
        
        return PaymentIntentResponse(
            client_secret=payment_intent.client_secret,
            order_id=order.id,
            publishable_key=publishable_key
        )
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/payment-intent/{payment_intent_id}")
async def get_payment_intent(payment_intent_id: str, db: Session = Depends(get_db)):
    """
    Get PaymentIntent status
    Called after payment submission to verify status
    """
    try:
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        order = db.query(Order).filter(
            Order.stripe_payment_intent_id == payment_intent_id
        ).first()
        
        return {
            "status": payment_intent.status,
            "amount": payment_intent.amount / 100,
            "order_id": order.id if order else None,
            "customer_email": payment_intent.metadata.get('customer_email'),
        }
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe Webhook Handler
    Listens for payment events from Stripe
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle different event types
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        # Update order status
        order = db.query(Order).filter(
            Order.stripe_payment_intent_id == payment_intent.id
        ).first()
        
        if order:
            order.payment_status = 'paid'
            order.updated_at = datetime.utcnow()
            db.commit()
            
            print(f"✅ Payment succeeded for Order #{order.id}")
            print(f"   Amount: ${payment_intent.amount / 100}")
            print(f"   Customer: {payment_intent.metadata.get('customer_email')}")
            
            # TODO: Your business logic here:
            # - Send confirmation email
            # - Update inventory
            # - Trigger fulfillment
    
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        
        order = db.query(Order).filter(
            Order.stripe_payment_intent_id == payment_intent.id
        ).first()
        
        if order:
            order.payment_status = 'failed'
            db.commit()
            
            print(f"❌ Payment failed for Order #{order.id}")
            print(f"   Reason: {payment_intent.last_payment_error}")
    
    elif event['type'] == 'payment_intent.canceled':
        payment_intent = event['data']['object']
        
        order = db.query(Order).filter(
            Order.stripe_payment_intent_id == payment_intent.id
        ).first()
        
        if order:
            order.payment_status = 'canceled'
            db.commit()
    
    return {"status": "success"}

@app.get("/api/orders/{order_id}")
async def get_order(order_id: int, db: Session = Depends(get_db)):
    """Get order details"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "id": order.id,
        "store_id": order.store_id,
        "customer_email": order.customer_email,
        "customer_name": order.customer_name,
        "cart_items": order.cart_items,
        "total_amount": float(order.total_amount),
        "payment_status": order.payment_status,
        "created_at": order.created_at.isoformat(),
    }

@app.get("/api/config")
async def get_config():
    """Get public Stripe configuration"""
    return {
        "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_your_key_here")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
