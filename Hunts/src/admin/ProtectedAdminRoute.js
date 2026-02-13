import React from 'react';
import { Navigate } from 'react-router-dom';
import { adminApi } from './adminApi';

const ProtectedAdminRoute = ({ children, requiredRole }) => {
  if (!adminApi.isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  const role = adminApi.getRole();
  const normalizedRole = role ? String(role).toUpperCase() : null;

  if (requiredRole) {
    const normalizedRequired = String(requiredRole).toUpperCase();
    if (normalizedRole !== normalizedRequired) {
      return <Navigate to="/admin/login" replace />;
    }
  }

  return children;
};

export default ProtectedAdminRoute;
