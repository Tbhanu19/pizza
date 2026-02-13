# Stripe Payment Element Integration Guide
## Embedded Payment Form (Better UX)

This implementation keeps users on YOUR website throughout the entire payment process - no redirect to Stripe needed.

---

## 🎯 What You're Building

An embedded payment form where:
- ✅ Users stay on your site the entire time
- ✅ Professional card input with real-time validation
- ✅ Supports all payment methods (cards, wallets, buy now pay later)
- ✅ Automatic 3D Secure authentication
- ✅ Mobile-optimized and accessible

---

## 📁 File Structure

```
your-project/
├── backend/
│   ├── payment_element_backend.py    # FastAPI server
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PaymentElementCheckout.jsx
│   │   │   └── PaymentElementCheckout.css
│   │   ├── pages/
│   │   │   ├── OrderConfirmation.jsx
│   │   │   └── OrderConfirmation.css
│   │   └── App.jsx
│   └── package.json
```

---

## 🚀 Quick Start

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn stripe sqlalchemy psycopg2-binary python-dotenv pydantic[email]

# Create .env file
cat > .env << EOF
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
DATABASE_URL=postgresql://user:password@localhost/ecommerce_db
EOF

# Run server
python payment_element_backend.py
```

Server runs at: `http://localhost:8000`

### 2. Frontend Setup (React)

```bash
cd frontend

# Install dependencies
npm install react react-dom react-router-dom @stripe/stripe-js @stripe/react-stripe-js

# Start development server
npm start
```

App runs at: `http://localhost:3000`

---

## 🔧 Configuration

### Get Stripe API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)
4. Add both to your `.env` file

### Setup Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. URL: `http://localhost:8000/api/webhook` (for testing)
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

### Test Locally with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# Or download from: https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8000/api/webhook

# Copy the webhook signing secret from output and add to .env
```

---

## 💳 Test Cards

**Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/34 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any 5 digits)
```

**Requires 3D Secure:**
```
Card Number: 4000 0027 6000 3184
```

**Payment Declined:**
```
Card Number: 4000 0000 0000 0002
```

More test cards: https://stripe.com/docs/testing

---

## 🔄 How It Works

### Payment Flow

```
1. User lands on checkout page
   ↓
2. Frontend calls /api/create-payment-intent
   ↓
3. Backend creates PaymentIntent and order in DB
   ↓
4. Backend returns client_secret to frontend
   ↓
5. Frontend displays Stripe Payment Element
   ↓
6. User enters card details
   ↓
7. User clicks "Pay"
   ↓
8. Stripe processes payment (3D Secure if needed)
   ↓
9. If successful, stay on page OR redirect to confirmation
   ↓
10. Webhook notifies backend
   ↓
11. Backend updates order status to "paid"
   ↓
12. Send confirmation email, update inventory, etc.
```

### Key API Endpoints

**POST `/api/create-payment-intent`**
- Creates a PaymentIntent
- Creates order record
- Returns client_secret for frontend

**GET `/api/payment-intent/{id}`**
- Checks payment status
- Used after payment completion

**POST `/api/webhook`**
- Receives Stripe events
- Updates order status
- Triggers business logic

**GET `/api/orders/{id}`**
- Gets order details
- Used on confirmation page

---

## 📝 Usage in Your App

### Example Integration

```jsx
// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PaymentElementCheckout from './components/PaymentElementCheckout';
import OrderConfirmation from './pages/OrderConfirmation';

function App() {
  const cartItems = [
    { id: 1, name: 'Product A', price: 29.99, quantity: 2 },
    { id: 2, name: 'Product B', price: 49.99, quantity: 1 },
  ];

  const currentStoreId = 1; // Your store ID

  return (
    <Router>
      <Routes>
        <Route 
          path="/checkout" 
          element={
            <PaymentElementCheckout 
              cartItems={cartItems}
              storeId={currentStoreId}
            />
          } 
        />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
      </Routes>
    </Router>
  );
}
```

---

## 🎨 Customization

### Change Stripe Element Appearance

In `PaymentElementCheckout.jsx`, modify the `appearance` object:

```javascript
const appearance = {
  theme: 'stripe', // 'stripe', 'night', or 'flat'
  variables: {
    colorPrimary: '#635bff',    // Your brand color
    colorBackground: '#ffffff',
    colorText: '#1a1a1a',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: '8px',
  },
};
```

### Add More Payment Methods

Update PaymentIntent creation in backend:

```python
payment_intent = stripe.PaymentIntent.create(
    amount=amount_cents,
    currency='usd',
    automatic_payment_methods={
        'enabled': True,
    },
    # Or specify exact methods:
    # payment_method_types=['card', 'klarna', 'afterpay_clearpay'],
)
```

---

## 🐛 Troubleshooting

### "No client secret found"
- Check backend is running
- Verify API endpoint is correct
- Check browser console for errors

### "Invalid API key"
- Confirm `.env` file exists
- Check key starts with `sk_test_`
- Restart backend after changing `.env`

### Webhooks not working
- Use Stripe CLI for local testing
- Check webhook secret matches
- Verify endpoint URL is accessible

### Payment succeeds but order not updated
- Check webhook is configured
- View backend logs
- Confirm webhook secret is correct

---

## 🚀 Going to Production

### 1. Get Live API Keys

1. Complete Stripe account activation
2. Go to https://dashboard.stripe.com/apikeys
3. Copy **live** keys (start with `pk_live_` and `sk_live_`)
4. Update production `.env`

### 2. Update Webhook

1. Create production webhook endpoint
2. Use your actual domain: `https://yourdomain.com/api/webhook`
3. Copy new webhook secret
4. Update production `.env`

### 3. Update URLs

In `PaymentElementCheckout.jsx`:
```javascript
// Change from:
fetch('http://localhost:8000/api/...')

// To:
fetch('https://api.yourdomain.com/api/...')
```

### 4. Enable HTTPS

- Required for production
- Use Let's Encrypt for free SSL
- Configure in your hosting provider

---

## 📊 Database Schema

```sql
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL,
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    cart_items JSONB,
    total_amount NUMERIC(10, 2),
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    payment_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## ✅ Testing Checklist

- [ ] Payment with valid card succeeds
- [ ] Payment with invalid card fails gracefully
- [ ] 3D Secure authentication works
- [ ] Webhook updates order status
- [ ] Confirmation page shows correct details
- [ ] Mobile layout looks good
- [ ] Error messages are clear
- [ ] Loading states work
- [ ] Can handle multiple stores

---

## 🔐 Security Best Practices

✅ **DO:**
- Keep secret keys in `.env` (never in code)
- Use HTTPS in production
- Validate webhook signatures
- Sanitize user inputs
- Use prepared SQL statements (SQLAlchemy handles this)

❌ **DON'T:**
- Commit `.env` to git
- Hardcode API keys
- Skip webhook signature verification
- Trust client-side data
- Store card details yourself

---

## 📚 Additional Resources

- **Stripe Docs**: https://stripe.com/docs/payments/payment-element
- **Stripe React**: https://stripe.com/docs/stripe-js/react
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Test Cards**: https://stripe.com/docs/testing

---

## 💡 Pro Tips

1. **Handle Edge Cases**: Payment might fail, user might close browser, webhooks might be delayed
2. **Idempotency**: Use Stripe's idempotency keys for retries
3. **Logging**: Log all payment events for debugging
4. **Email Confirmations**: Send receipts after successful payment
5. **Inventory Management**: Reserve stock when order created, confirm when paid

---

Need help? Check the code comments or Stripe's documentation!
