import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { adminApi } from './adminApi';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    adminApi.setAuth(null);
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-title">Admin</span>
        </div>
        <nav className="admin-sidebar-nav">
          <NavLink
            to="/admin/store"
            end
            className={({ isActive }) => (isActive ? 'admin-nav-link active' : 'admin-nav-link')}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/store/orders"
            className={({ isActive }) => (isActive ? 'admin-nav-link active' : 'admin-nav-link')}
          >
            My Orders
          </NavLink>
        </nav>
        <div className="admin-sidebar-footer">
          <button type="button" className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
