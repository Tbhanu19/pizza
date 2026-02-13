import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { setAdminToken } from './adminAxios';
import './AdminDashboardLayout.css';

const AdminIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const AdminDashboardLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setAdminToken(null);
    navigate('/admin');
  };

  return (
    <div className="admin-dashboard-layout">
      <aside className="admin-dashboard-sidebar">
        <div className="admin-dashboard-sidebar-header">
          <span className="admin-dashboard-sidebar-title">Admin</span>
          <NavLink
            to="/admin/dashboard/profile"
            className={({ isActive }) => `admin-dashboard-profile-icon ${isActive ? 'active' : ''}`}
            title="Edit profile & store details"
          >
            <AdminIcon />
          </NavLink>
        </div>
        <nav className="admin-dashboard-sidebar-nav">
          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) => (isActive ? 'admin-dashboard-nav-link active' : 'admin-dashboard-nav-link')}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/dashboard/orders"
            className={({ isActive }) => (isActive ? 'admin-dashboard-nav-link active' : 'admin-dashboard-nav-link')}
          >
            My Orders
          </NavLink>
        </nav>
        <div className="admin-dashboard-sidebar-footer">
          <button type="button" className="admin-dashboard-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main 
        className="admin-dashboard-main"
        style={{
          backgroundImage: `linear-gradient(
            rgba(255, 255, 255, 0.6),
            rgba(255, 255, 255, 0.5)
          ), url(${process.env.PUBLIC_URL || ''}/hero-pizza.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
