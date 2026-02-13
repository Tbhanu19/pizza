import React from 'react';
import { Navigate } from 'react-router-dom';

const ADMIN_TOKEN_KEY = 'adminToken';

const ProtectedAdminRouteToken = ({ children }) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

export default ProtectedAdminRouteToken;
