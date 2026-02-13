import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminAxios from './adminAxios';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const { data } = await adminAxios.get('/admin/me');
        const storeData = data?.store ?? data;
        if (storeData) {
          setStore(storeData);
          const active = storeData.is_active ?? storeData.active ?? storeData.isActive ?? false;
          setIsActive(Boolean(active));
        }
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/admin');
          return;
        }
        setError('Failed to load store information');
      } finally {
        setLoading(false);
      }
    };
    fetchStoreInfo();
  }, [navigate]);

  const handleToggleActivity = async () => {
    setUpdating(true);
    setError('');
    try {
      const newStatus = !isActive;
      await adminAxios.patch('/admin/store', {
        is_active: newStatus,
      });
      setIsActive(newStatus);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to update store activity');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div className="admin-dashboard-page-inner">
          <div className="admin-dashboard-loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dashboard-page-inner">
        <h1>Welcome Admin</h1>
        <p className="admin-dashboard-page-sub">Use the sidebar to view and manage orders.</p>

        {store && (
          <div className="admin-dashboard-store-section">
            <div className="admin-dashboard-store-header">
              <h2 className="admin-dashboard-store-title">
                {(store.store_name || store.name || 'Store').toUpperCase()}
              </h2>
              <div className={`admin-dashboard-store-status ${isActive ? 'active' : 'inactive'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            {error && <div className="admin-dashboard-error">{error}</div>}
            <div className="admin-dashboard-store-controls">
              <label className="admin-dashboard-toggle-label">
                <span>Store Activity:</span>
                <button
                  type="button"
                  className={`admin-dashboard-toggle-btn ${isActive ? 'active' : ''}`}
                  onClick={handleToggleActivity}
                  disabled={updating}
                >
                  {updating ? 'Updating...' : (isActive ? 'Deactivate Store' : 'Activate Store')}
                </button>
              </label>
            </div>
          </div>
        )}

        <Link to="/admin/dashboard/orders" className="admin-dashboard-page-cta">
          View My Orders
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
