// ============= Order Confirmation Page =============
// src/pages/OrderConfirmation.jsx

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID found');
      setLoading(false);
      return;
    }

    // Fetch order details
    fetch(`http://localhost:8000/api/orders/${orderId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        return response.json();
      })
      .then(data => {
        setOrderData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching order:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="confirmation-container">
        <div className="loading-spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="confirmation-container">
        <div className="error-card">
          <div className="error-icon">❌</div>
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <Link to="/" className="button">Return to Home</Link>
        </div>
      </div>
    );
  }

  const isPaid = orderData?.payment_status === 'paid';

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        {/* Success Icon */}
        {isPaid && (
          <div className="success-icon-wrapper">
            <svg className="success-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#10b981" />
              <path
                d="M8 12.5l2.5 2.5L16 9"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        <h1>{isPaid ? 'Order Confirmed!' : 'Order Pending'}</h1>
        <p className="confirmation-message">
          {isPaid 
            ? 'Thank you for your purchase. Your order has been confirmed and will be processed shortly.'
            : 'Your order has been created but payment is still processing.'}
        </p>

        {/* Order Details */}
        <div className="order-details-card">
          <h3>Order Details</h3>
          
          <div className="detail-row">
            <span>Order Number:</span>
            <strong>#{orderData?.id}</strong>
          </div>

          <div className="detail-row">
            <span>Total Amount:</span>
            <strong>${orderData?.total_amount?.toFixed(2)}</strong>
          </div>

          {orderData?.customer_email && (
            <div className="detail-row">
              <span>Email:</span>
              <strong>{orderData.customer_email}</strong>
            </div>
          )}

          {orderData?.customer_name && (
            <div className="detail-row">
              <span>Name:</span>
              <strong>{orderData.customer_name}</strong>
            </div>
          )}

          <div className="detail-row">
            <span>Payment Status:</span>
            <span className={`status-badge ${orderData?.payment_status}`}>
              {orderData?.payment_status}
            </span>
          </div>

          <div className="detail-row">
            <span>Order Date:</span>
            <strong>
              {new Date(orderData?.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </strong>
          </div>
        </div>

        {/* Order Items */}
        {orderData?.cart_items && (
          <div className="order-items-card">
            <h3>Items Ordered</h3>
            {orderData.cart_items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-details">
                  <h4>{item.name}</h4>
                  <p>Quantity: {item.quantity}</p>
                </div>
                <div className="item-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Email Confirmation Notice */}
        {isPaid && orderData?.customer_email && (
          <div className="info-box">
            <svg className="info-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p>
              A confirmation email has been sent to <strong>{orderData.customer_email}</strong>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <Link to="/" className="button button-primary">
            Continue Shopping
          </Link>
          <button 
            onClick={() => window.print()} 
            className="button button-secondary"
          >
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
