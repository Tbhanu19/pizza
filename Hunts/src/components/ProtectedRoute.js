import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, authChecked } = useAuth();

  if (!authChecked) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ showSignIn: true }} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;
