import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { formatDateTime } from '../utils/dateUtils';
import './Orders.css';

const Orders = () => {
  const { user, authChecked } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const previousStatusesRef = useRef({});

  const fetchOrders = async () => {
    if (!api.isConfigured()) return;
    try {
      const data = await api.getOrders();
      const raw = Array.isArray(data) ? data : data?.orders || [];
      
      const currentStatuses = {};
      raw.forEach(order => {
        const status = order.status ?? order.order_status ?? order.state ?? order.order_state ?? 'Confirmed';
        currentStatuses[order.id] = String(status).trim();
      });

      const previousStatuses = previousStatusesRef.current;
      let statusChanged = false;
      
      Object.keys(currentStatuses).forEach(orderId => {
        if (previousStatuses[orderId] && previousStatuses[orderId] !== currentStatuses[orderId]) {
          statusChanged = true;
        }
      });

      if (statusChanged && Object.keys(previousStatuses).length > 0) {
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.play().catch(() => {});
        } catch (err) {}
      }

      previousStatusesRef.current = currentStatuses;
      setOrders(raw);
      setError('');
    } catch (err) {
      setError(err.detail || err.message || 'Could not load orders.');
    }
  };

  useEffect(() => {
    if (!authChecked || !user) {
      setLoading(false);
      setOrders([]);
      return;
    }
    if (!api.isConfigured()) {
      setLoading(false);
      setOrders([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    
    fetchOrders().finally(() => {
      if (!cancelled) setLoading(false);
    });

    const interval = setInterval(() => {
      if (!cancelled) {
        fetchOrders();
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, authChecked]);

  const getOrderTime = (order) => {
    const raw =
      order.created_at ??
      order.createdAt ??
      order.date ??
      order.order_date ??
      order.order_time ??
      order.ordered_at ??
      order.placed_at ??
      order.timestamp ??
      order.updated_at;
    return formatDateTime(raw);
  };

  const getOrderStatus = (order) => {
    const raw = order.status ?? order.order_status ?? order.state ?? order.order_state;
    if (raw != null && String(raw).trim() !== '') return String(raw).trim();
    return 'Confirmed';
  };

  const getOrderLocation = (order) => {
    const loc = order.location;
    if (loc && (loc.store_name || loc.name)) return loc.store_name || loc.name;
    if (order.store_name) return order.store_name;
    if (order.location_name) return order.location_name;
    if (loc && (loc.address || loc.city)) return [loc.address, loc.city, loc.state].filter(Boolean).join(', ');
    if (order.location_address) return order.location_address;
    return null;
  };

  const formatTotal = (value) => {
    if (value == null) return '—';
    const n = Number(value);
    return Number.isNaN(n) ? value : `$${n.toFixed(2)}`;
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  if (!authChecked) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <h1 className="orders-title">My Orders</h1>
          <div className="orders-loading">Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="orders-page">
        <div className="orders-container">
          <h1 className="orders-title">My Orders</h1>
          <div className="orders-empty">
            <p>Sign in to view your order history.</p>
            <Link to="/menu" className="orders-btn primary">Browse Menu</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <h1 className="orders-title">My Orders</h1>

        {loading && (
          <div className="orders-loading">Loading your orders…</div>
        )}

        {!loading && error && (
          <div className="orders-message error">{error}</div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="orders-empty">
            <p>Your order history will appear here.</p>
            <Link to="/menu" className="orders-btn primary">Browse Menu</Link>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <ul className="orders-list">
            {orders.map((order) => (
              <li key={order.id} className="order-card">
                <div className="order-card-header">
                  <span className="order-id">Order #{order.id}</span>
                  <span className="order-total-value order-card-total">{formatTotal(order.total)}</span>
                </div>
                <div className="order-card-meta">
                  <div className="order-meta-row">
                    <span className="order-meta-label">Order time</span>
                    <span className="order-meta-value">{getOrderTime(order)}</span>
                  </div>
                  <div className="order-meta-row">
                    <span className="order-meta-label">Location</span>
                    <span className="order-meta-value">{getOrderLocation(order) || '—'}</span>
                  </div>
                  <div className="order-meta-row">
                    <span className="order-meta-label">Status</span>
                    <span className="order-status-badge">{getOrderStatus(order)}</span>
                  </div>
                </div>
                <div className="order-card-body">
                  {(order.items && order.items.length > 0) && (
                    <div className="order-items-preview">
                      <p>
                        {(expandedOrders.has(order.id) ? order.items : order.items.slice(0, 3)).map((item, i) => (
                          <span key={i}>{item.name || item.product_name || item.title || 'Item'}{item.quantity > 1 ? ` × ${item.quantity}` : ''}</span>
                        ))}
                      </p>
                      {order.items.length > 3 && (
                        <button
                          type="button"
                          className="order-items-toggle"
                          onClick={() => toggleOrderExpansion(order.id)}
                        >
                          {expandedOrders.has(order.id) 
                            ? 'Show less' 
                            : `+${order.items.length - 3} more`}
                        </button>
                      )}
                    </div>
                  )}
                  {(order.address || order.delivery_address) && (
                    <p className="order-address">
                      <span className="order-address-label">Delivery: </span>
                      {order.address || order.delivery_address}
                      {order.city ? `, ${order.city}` : ''}
                      {order.zipCode || order.zip_code ? ` ${order.zipCode || order.zip_code}` : ''}
                    </p>
                  )}
                  <p className="order-total">
                    <span className="order-total-label">Total</span>
                    <span className="order-total-value">{formatTotal(order.total)}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && orders.length > 0 && (
          <div className="orders-actions">
            <Link to="/menu" className="orders-btn secondary">Browse Menu</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
