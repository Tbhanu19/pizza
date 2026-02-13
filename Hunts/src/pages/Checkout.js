import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useLocationContext } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Checkout.css';

function getStoreIsActive(store) {
  if (!store || store.isCurrent) return true;
  const status =
    store.storestatus ??
    store.store_status ??
    store.status ??
    store.store?.storestatus ??
    store.store?.store_status ??
    store.store?.is_active ??
    store.is_active ??
    store.active ??
    store.isActive;
  if (status === undefined || status === null) return true;
  if (typeof status === 'string') {
    return status.toLowerCase() === 'active';
  }
  return Boolean(status);
}

function PaymentForm({ orderTotal, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setMessage(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
      redirect: 'if_required',
    });
    if (error) {
      setMessage(error.message || 'Payment failed.');
      setIsProcessing(false);
      if (onError) onError(error);
      return;
    }
    setIsProcessing(false);
    if (onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handlePay} className="checkout-stripe-form">
      <PaymentElement />
      {message && <p className="error-message checkout-stripe-error">{message}</p>}
      <button
        type="submit"
        className="submit-order-btn checkout-stripe-pay"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? 'Processing...' : `Pay $${Number(orderTotal).toFixed(2)}`}
      </button>
    </form>
  );
}

const Checkout = () => {
  const { cart, getTotalPrice, clearCart, useBackend } = useCart();
  const { selectedLocation } = useLocationContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: 'card',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isStoreActive, setIsStoreActive] = useState(true);
  const [hasPrefilled, setHasPrefilled] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);
  const [paymentStep, setPaymentStep] = useState(null);

  const total = getTotalPrice();
  const deliveryFee = 0.00;
  const finalTotal = total + deliveryFee;

  useEffect(() => {
    if (user && !hasPrefilled) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }));
      setHasPrefilled(true);
    }
  }, [user, hasPrefilled]);

  useEffect(() => {
    if (selectedLocation && !selectedLocation.isCurrent) {
      const active = getStoreIsActive(selectedLocation);
      setIsStoreActive(active);
      if (!active) {
        setSubmitError('Currently this store is inactive to recive orders,thanks for your intrest');
      } else {
        setSubmitError('');
      }
    } else {
      setIsStoreActive(true);
    }
  }, [selectedLocation]);

  useEffect(() => {
    const key = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (key) {
      loadStripe(key).then(setStripePromise);
      return;
    }
    if (api.isConfigured()) {
      api.getPaymentConfig().then((data) => {
        if (data && data.publishable_key) loadStripe(data.publishable_key).then(setStripePromise);
      }).catch(() => {});
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedLocation || !selectedLocation.id || selectedLocation.id === 'current') {
      setSubmitError('Please select a store location');
      return false;
    }

    if (!isStoreActive) {
      setSubmitError('Currently this store is inactive to recive orders,thanks for your intrest');
      return false;
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Zip code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!isStoreActive) {
      setSubmitError('Currently this store is inactive to recive orders,thanks for your intrest');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    let order = null;
    try {
      if (useBackend && api.isConfigured()) {
        if (!selectedLocation || !selectedLocation.id || selectedLocation.id === 'current') {
          setSubmitError('Please select a store location');
          setIsSubmitting(false);
          return;
        }
        const payload = {
          ...formData,
          store_id: selectedLocation.store_id ?? selectedLocation.id,
          location: selectedLocation ? {
            store_name: selectedLocation.store_name,
            address: selectedLocation.address,
            area: selectedLocation.area,
            city: selectedLocation.city,
            state: selectedLocation.state,
            pincode: selectedLocation.pincode,
            phone: selectedLocation.phone,
            opening_time: selectedLocation.opening_time,
            closing_time: selectedLocation.closing_time
          } : undefined
        };
        order = await api.checkout(payload);
        await clearCart();
        if (formData.paymentMethod === 'card' && stripePromise) {
          try {
            const { client_secret } = await api.createPaymentIntent(order.id);
            setPaymentStep({
              orderId: order.id,
              clientSecret: client_secret,
              orderTotal: (order.total || total) + deliveryFee,
              formData: { ...formData },
            });
          } catch (payErr) {
            const payMsg = payErr.detail || payErr.message || 'Payment setup failed.';
            navigate('/order-confirmation', {
              state: {
                orderData: formData,
                total: (order.total || total) + deliveryFee,
                orderId: order.id,
                paymentError: payMsg,
              },
            });
          }
        } else {
          navigate('/order-confirmation', {
            state: { orderData: formData, total: (order.total || total) + deliveryFee, orderId: order.id },
          });
        }
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        await clearCart();
        navigate('/order-confirmation', { state: { orderData: formData, total: finalTotal } });
      }
    } catch (err) {
      const msg = Array.isArray(err.detail) ? err.detail.map((d) => d.msg || JSON.stringify(d)).join(', ') : (err.detail || err.message || 'Checkout failed. Try again.');
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (!paymentStep) return;
    navigate('/order-confirmation', {
      state: { orderData: paymentStep.formData, total: paymentStep.orderTotal, orderId: paymentStep.orderId },
    });
  };

  if (cart.length === 0 && !paymentStep) {
    return (
      <div className="checkout-page">
        <div className="empty-cart-message">
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart before checkout.</p>
        </div>
      </div>
    );
  }

  if (paymentStep && paymentStep.clientSecret && stripePromise) {
    const options = {
      clientSecret: paymentStep.clientSecret,
      appearance: {
        theme: 'stripe',
        variables: { colorPrimary: '#e31837', borderRadius: '8px' },
      },
    };
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <h1>Complete payment</h1>
          <div className="checkout-content">
            <div className="form-section checkout-stripe-section">
              <p className="checkout-stripe-order-id">Order #{paymentStep.orderId}</p>
              <p className="checkout-stripe-total">Total: ${Number(paymentStep.orderTotal).toFixed(2)}</p>
              <Elements stripe={stripePromise} options={options}>
                <PaymentForm
                  orderTotal={paymentStep.orderTotal}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </div>
            <div className="order-summary">
              <h2>Order Summary</h2>
              <div className="summary-totals">
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>${Number(paymentStep.orderTotal).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1>Checkout</h1>

        {selectedLocation && !selectedLocation.isCurrent && !isStoreActive && (
          <div className="store-inactive-banner">
            <p>Currently this store is inactive to recive orders,thanks for your intrest</p>
          </div>
        )}

        <div className="checkout-content">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Delivery Information</h2>
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="address">Delivery Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={errors.city ? 'error' : ''}
                  />
                  {errors.city && <span className="error-message">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="zipCode">Zip Code *</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className={errors.zipCode ? 'error' : ''}
                  />
                  {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Payment Method</h2>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleChange}
                  />
                  <span>Credit/Debit Card</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={handleChange}
                  />
                  <span>Cash on Delivery</span>
                </label>
              </div>
            </div>

            {submitError && <p className="error-message">{submitError}</p>}
            <button
              type="submit"
              className="submit-order-btn"
              disabled={isSubmitting || !isStoreActive}
            >
              {isSubmitting ? 'Processing...' : `Place Order - $${finalTotal.toFixed(2)}`}
            </button>
          </form>

          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="summary-item">
                  <div className="summary-item-info">
                    <span className="summary-item-name">{item.name}</span>
                    <span className="summary-item-quantity">x{item.quantity}</span>
                  </div>
                  <span className="summary-item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee:</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

