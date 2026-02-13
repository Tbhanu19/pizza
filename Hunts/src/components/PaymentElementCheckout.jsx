// ============= Payment Element Checkout Component =============
// src/components/PaymentElementCheckout.jsx

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import './PaymentElementCheckout.css';

// Initialize Stripe (this will be set after fetching config)
let stripePromise = null;

// Payment Form Component (inside Elements wrapper)
const CheckoutForm = ({ orderTotal, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    // Confirm the payment
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-confirmation`,
      },
      redirect: 'if_required', // Stay on page if no redirect needed
    });

    if (error) {
      // Payment failed
      setMessage(error.message);
      setIsProcessing(false);
      if (onError) {
        onError(error);
      }
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded
      setMessage('Payment successful!');
      setIsProcessing(false);
      if (onSuccess) {
        onSuccess(paymentIntent);
      }
    } else {
      setMessage('Payment processing...');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <PaymentElement />
      
      {message && (
        <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="pay-button"
      >
        {isProcessing ? (
          <>
            <span className="spinner"></span>
            Processing...
          </>
        ) : (
          `Pay $${orderTotal.toFixed(2)}`
        )}
      </button>
    </form>
  );
};

// Main Checkout Component
const PaymentElementCheckout = ({ cartItems, storeId }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  
  // Form data
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Calculate total
  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const total = calculateTotal();

  // Initialize Stripe with publishable key
  useEffect(() => {
    // Fetch Stripe config
    fetch('http://localhost:8000/api/config')
      .then(res => res.json())
      .then(data => {
        stripePromise = loadStripe(data.publishable_key);
      })
      .catch(err => {
        console.error('Failed to load Stripe config:', err);
        setError('Failed to initialize payment system');
        setLoading(false);
      });
  }, []);

  // Create PaymentIntent when component mounts
  useEffect(() => {
    if (!stripePromise) return;

    fetch('http://localhost:8000/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        store_id: storeId,
        cart_items: cartItems,
        customer_email: customerEmail || null,
        customer_name: customerName || null,
      }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to create payment intent');
        }
        return res.json();
      })
      .then(data => {
        setClientSecret(data.client_secret);
        setOrderId(data.order_id);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [storeId, cartItems]);

  const handlePaymentSuccess = (paymentIntent) => {
    console.log('Payment succeeded:', paymentIntent);
    setPaymentSucceeded(true);
    
    // Optional: Redirect to success page after delay
    setTimeout(() => {
      window.location.href = `/order-confirmation?order_id=${orderId}`;
    }, 2000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  if (loading) {
    return (
      <div className="checkout-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading payment form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="checkout-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (paymentSucceeded) {
    return (
      <div className="checkout-container">
        <div className="success-state">
          <div className="success-icon">✓</div>
          <h2>Payment Successful!</h2>
          <p>Order #{orderId}</p>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#635bff',
      colorBackground: '#ffffff',
      colorText: '#1a1a1a',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="checkout-container">
      <div className="checkout-wrapper">
        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>
          
          <div className="cart-items-list">
            {cartItems.map((item) => (
              <div key={item.id} className="summary-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>Qty: {item.quantity}</p>
                </div>
                <div className="item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="summary-total">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="total-row total-final">
              <strong>Total:</strong>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="payment-section">
          <h2>Payment Details</h2>
          
          {/* Customer Information */}
          <div className="customer-info">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="john@example.com"
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Stripe Payment Element */}
          {clientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm
                orderTotal={total}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          )}

          <div className="security-badges">
            <div className="badge">
              <svg className="badge-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Secure Payment</span>
            </div>
            <div className="badge">
              <span>Powered by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentElementCheckout;
