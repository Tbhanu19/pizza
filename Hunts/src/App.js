import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import MyAccount from './pages/MyAccount';
import ProtectedRoute from './components/ProtectedRoute';
import AdminAuth from './admin/AdminAuth';
import AdminDashboardLayout from './admin/AdminDashboardLayout';
import AdminDashboardPage from './admin/AdminDashboardPage';
import AdminDashboardOrders from './admin/AdminDashboardOrders';
import AdminProfile from './admin/AdminProfile';
import ProtectedAdminRouteToken from './admin/ProtectedAdminRouteToken';
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';
import ProtectedAdminRoute from './admin/ProtectedAdminRoute';
import StoreAdminDashboard from './admin/StoreAdminDashboard';
import StoreAdminOrders from './admin/StoreAdminOrders';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api';
import './App.css';

function Auth401Handler() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    api.setOn401(() => {
      logout();
      navigate('/', { state: { showSignIn: true } });
    });
  }, [logout, navigate]);
  return null;
}

function CustomerRoutes() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <Router>
            <Auth401Handler />
            <div className="App">
              <Routes>
                <Route path="/admin" element={<AdminAuth />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedAdminRouteToken>
                      <AdminDashboardLayout />
                    </ProtectedAdminRouteToken>
                  }
                >
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="orders" element={<AdminDashboardOrders />} />
                  <Route path="profile" element={<AdminProfile />} />
                </Route>
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/store"
                  element={
                    <ProtectedAdminRoute>
                      <AdminLayout />
                    </ProtectedAdminRoute>
                  }
                >
                  <Route index element={<StoreAdminDashboard />} />
                  <Route path="orders" element={<StoreAdminOrders />} />
                </Route>
                <Route path="*" element={<CustomerRoutes />} />
              </Routes>
            </div>
          </Router>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
