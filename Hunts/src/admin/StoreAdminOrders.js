import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from './adminApi';
import OrdersList from './OrdersList';
import './AdminDashboard.css';

const StoreAdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);

  const fetchOrders = async () => {
    try {
      const data = await adminApi.getOrders();
      const ordersList = Array.isArray(data) ? data : data?.orders || [];
      setOrders(ordersList);
      setError('');
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
  }, [navigate]);

  const handleStatusUpdate = () => {
    fetchOrders();
  };

  if (loading) {
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
        <h1 className="admin-page-title">My Orders</h1>
        {error && <div className="admin-error">{error}</div>}
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

export default StoreAdminOrders;
