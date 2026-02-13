import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const location = useLocation();
  const { orderData, total, orderId, paymentError } = location.state || {};

  if (!orderData) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-container">
          <h2>No order found</h2>
          <Link to="/" className="home-btn">Go to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        {paymentError && (
          <div className="confirmation-payment-error">
            {paymentError}
          </div>
        )}
        <div className="confirmation-icon">✅</div>
        <h1>Order Confirmed!</h1>
        {orderId && <p className="confirmation-order-id">Order #{orderId}</p>}
        <p className="confirmation-message">
          Thank you for your order, {orderData.name}!
        </p>
        <p className="confirmation-details">
          Your order will be delivered to {orderData.address}, {orderData.city} {orderData.zipCode}
        </p>
        <div className="order-total">
          <span>Total Amount:</span>
          <span className="total-amount">${total?.toFixed(2) || '0.00'}</span>
        </div>
        <p className="delivery-time">
          Estimated delivery time: 30-45 minutes
        </p>
        <div className="confirmation-actions">
          <Link to="/menu" className="order-again-btn">
            Order Again
          </Link>
          <Link to="/" className="home-btn">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;

