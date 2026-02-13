import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import adminAxios from './adminAxios';
import OrdersList from './OrdersList';
import './AdminDashboard.css';

function normalizeOrdersList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const list = data.orders ?? data.data ?? data.results ?? data.list;
  return Array.isArray(list) ? list : [];
}

const AdminDashboardOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [bannerMessage, setBannerMessage] = useState(null);
  const [bannerType, setBannerType] = useState('success');
  const storeIdRef = useRef(null);
  const storeIdFetchedRef = useRef(false);
  const intervalRef = useRef(null);
  const bannerTimeoutRef = useRef(null);

  useEffect(() => {
    storeIdRef.current = storeId;
  }, [storeId]);

  useEffect(() => {
    if (storeIdFetchedRef.current) return;
    storeIdFetchedRef.current = true;
    adminAxios
      .get('/admin/me')
      .then(({ data }) => {
        const id = data?.store_id ?? data?.storeId ?? data?.store?.id ?? data?.store_id;
        if (id != null && id !== '') {
          const storeIdStr = String(id);
          setStoreId(storeIdStr);
          storeIdRef.current = storeIdStr;
        }
      })
      .catch(() => {});
  }, []);

  const fetchOrders = async () => {
    try {
      const currentStoreId = storeIdRef.current;
      const url = currentStoreId
        ? `/admin/orders?store_id=${encodeURIComponent(currentStoreId)}`
        : '/admin/orders';
      const { data } = await adminAxios.get(url);
      const ordersList = normalizeOrdersList(data);
      setOrders(ordersList);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/admin');
        return;
      }
      setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    intervalRef.current = setInterval(fetchOrders, 5000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [navigate]); 

  const showBanner = (message, type = 'success') => {
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }
    setBannerMessage(message);
    setBannerType(type);
    bannerTimeoutRef.current = setTimeout(() => {
      setBannerMessage(null);
      bannerTimeoutRef.current = null;
    }, 5000);
  };

  const updateOrderStatusFn = async (orderId, status) => {
    await adminAxios.patch(`/admin/orders/${orderId}`, { status });
  };

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, []);

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
        <h1 className="admin-page-title">My Orders</h1>
        {bannerMessage && (
          <div className={`admin-status-banner ${bannerType}`}>
            <span>{bannerMessage}</span>
            <button
              type="button"
              className="admin-status-banner-close"
              onClick={() => {
                setBannerMessage(null);
                if (bannerTimeoutRef.current) {
                  clearTimeout(bannerTimeoutRef.current);
                  bannerTimeoutRef.current = null;
                }
              }}
            >
              ×
            </button>
          </div>
        )}
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
            className={`admin-filter-btn ${activeFilter === 'OUT_FOR_DELIVERY' ? 'active' : ''}`}
            onClick={() => setActiveFilter('OUT_FOR_DELIVERY')}
          >
            Out for Delivery
          </button>
          <button
            type="button"
            className={`admin-filter-btn ${activeFilter === 'DELIVERED' ? 'active' : ''}`}
            onClick={() => setActiveFilter('DELIVERED')}
          >
            Delivered
          </button>
          <button
            type="button"
            className={`admin-filter-btn ${activeFilter === 'REJECTED' ? 'active' : ''}`}
            onClick={() => setActiveFilter('REJECTED')}
          >
            Rejected
          </button>
        </div>
        <OrdersList
          orders={orders}
          onStatusUpdate={fetchOrders}
          filterStatus={activeFilter}
          updateOrderStatusFn={updateOrderStatusFn}
          onStatusChangeBanner={showBanner}
        />
      </div>
    </div>
  );
};

export default AdminDashboardOrders;
