import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from './adminApi';
import { parseApiDate } from '../utils/dateUtils';
import OrdersList from './OrdersList';
import './AdminDashboard.css';

const StoreAdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const previousPendingCountRef = useRef(0);

  const fetchOrders = async () => {
    try {
      const data = await adminApi.getOrders();
      const ordersList = Array.isArray(data) ? data : data?.orders || [];
      setOrders(ordersList);
      setError('');

      const pendingOrders = ordersList.filter((order) => {
        const status = order.status ?? order.order_status ?? order.state ?? order.order_state;
        return String(status || '').toUpperCase() === 'PENDING';
      });

      if (
        previousPendingCountRef.current > 0 &&
        pendingOrders.length > previousPendingCountRef.current
      ) {
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.play().catch(() => {});
        } catch (err) {}
      }

      previousPendingCountRef.current = pendingOrders.length;
    } catch (err) {
      if (err.status === 401) {
        adminApi.setAuth(null);
        navigate('/admin/login');
      } else {
        setError(err.detail || err.message || 'Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleStatusUpdate = () => {
    fetchOrders();
  };

  const getTodayOrders = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return orders.filter((order) => {
      const raw =
        order.created_at ||
        order.createdAt ||
        order.date ||
        order.order_date ||
        order.timestamp ||
        0;
      const orderDate = parseApiDate(raw);
      if (!orderDate || Number.isNaN(orderDate.getTime())) return false;
      return orderDate >= today;
    });
  };

  const getOrdersByStatus = (status) => {
    return orders.filter((order) => {
      const orderStatus =
        order.status ?? order.order_status ?? order.state ?? order.order_state;
      return String(orderStatus || '').toUpperCase() === status.toUpperCase();
    });
  };

  const todayOrders = getTodayOrders();
  const pendingOrders = getOrdersByStatus('PENDING');
  const acceptedOrders = getOrdersByStatus('ACCEPTED');
  const rejectedOrders = getOrdersByStatus('REJECTED');

  const stats = [
    { label: 'Total Orders Today', value: todayOrders.length, color: '#333' },
    { label: 'Pending Orders', value: pendingOrders.length, color: '#856404' },
    { label: 'Accepted Orders', value: acceptedOrders.length, color: '#0c5460' },
    { label: 'Rejected Orders', value: rejectedOrders.length, color: '#721c24' },
  ];

  if (loading && orders.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-container">
          <div className="admin-loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-container">
        <h1 className="admin-page-title">Store Dashboard</h1>
        {error && <div className="admin-error">{error}</div>}
        <div className="admin-stats">
          {stats.map((stat, index) => (
            <div key={index} className="admin-stat-card">
              <div className="admin-stat-value" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="admin-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="admin-filters">
          <button
            type="button"
            className={`admin-filter-btn ${activeFilter === null ? 'active' : ''}`}
            onClick={() => setActiveFilter(null)}
          >
            All Orders
          </button>
          <button
            type="button"
            className={`admin-filter-btn ${activeFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveFilter('PENDING')}
          >
            Pending
          </button>
          <button
            type="button"
            className={`admin-filter-btn ${activeFilter === 'ACCEPTED' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ACCEPTED')}
          >
            Accepted
          </button>
          <button
            type="button"
            className={`admin-filter-btn ${activeFilter === 'PREPARING' ? 'active' : ''}`}
            onClick={() => setActiveFilter('PREPARING')}
          >
            Preparing
          </button>
          <button
            type="button"
            className={`admin-filter-btn ${activeFilter === 'READY' ? 'active' : ''}`}
            onClick={() => setActiveFilter('READY')}
          >
            Ready
          </button>
          <button
            type="button"
            className={`admin-filter-btn ${activeFilter === 'DELIVERED' ? 'active' : ''}`}
            onClick={() => setActiveFilter('DELIVERED')}
          >
            Delivered
          </button>
        </div>
        <OrdersList
          orders={orders}
          onStatusUpdate={handleStatusUpdate}
          filterStatus={activeFilter}
        />
      </div>
    </div>
  );
};

export default StoreAdminDashboard;
