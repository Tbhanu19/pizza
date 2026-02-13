import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from './adminApi';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState(null); 
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorField === name) {
      setError('');
      setErrorField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorField(null);
    setLoading(true);

    try {
      const response = await adminApi.login(formData);
      if (!response) {
        setError('Login failed: No response received');
        return;
      }
      
      const token = response.token || response.access_token;
      if (token) {
        adminApi.setAuth({
          token: token,
          access_token: token,
          role: response.role || null,
          store_id: response.store_id ?? response.storeId ?? null,
        });
        navigate('/admin/dashboard');
      } else {
        setError('Login failed: No token received. Please try again.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      const errorMessage = err.response?.data?.detail || err.detail || err.message || 'Login failed. Please check your credentials.';
      const errorTypeHeader = err.response?.headers?.['x-error-type'];
      let errorType = errorTypeHeader;
      
      if (!errorType) {
        const msgLower = errorMessage.toLowerCase();
        if (msgLower.includes('email') || msgLower.includes('invalid email')) {
          errorType = 'email';
        } else if (msgLower.includes('password') || msgLower.includes('incorrect password')) {
          errorType = 'password';
        }
      }
      
      setError(errorMessage);
      setErrorField(errorType || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <h1>store Login</h1>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className={errorField === 'email' ? 'error-input' : ''}
            />
            {errorField === 'email' && (
              <div className="field-error-message">Invalid email address</div>
            )}
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className={errorField === 'password' ? 'error-input' : ''}
            />
            {errorField === 'password' && (
              <div className="field-error-message">Incorrect password</div>
            )}
          </div>
          {error && errorField === null && <div className="error-message">{error}</div>}
          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
