import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminAxios, { setAdminToken } from './adminAxios';
import './AdminAuth.css';

const AdminAuth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState({
    storeName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    adminName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSignInChange = (e) => {
    const { name, value } = e.target;
    setSignInData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberDigits = phoneNumber.slice(0, 10);
    
    if (phoneNumberDigits.length === 0) {
      return '';
    } else if (phoneNumberDigits.length <= 3) {
      return `(${phoneNumberDigits}`;
    } else if (phoneNumberDigits.length <= 6) {
      return `(${phoneNumberDigits.slice(0, 3)}) ${phoneNumberDigits.slice(3)}`;
    } else {
      return `(${phoneNumberDigits.slice(0, 3)}) ${phoneNumberDigits.slice(3, 6)}-${phoneNumberDigits.slice(6)}`;
    }
  };

  const handleSignUpChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setSignUpData((prev) => ({ ...prev, [name]: formatted }));
    } else {
      setSignUpData((prev) => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await adminAxios.post('/admin/login', {
        email: signInData.email,
        password: signInData.password,
      });
      const token = data.access_token ?? data.token;
      if (token) {
        setAdminToken(token);
        navigate('/admin/dashboard');
      } else {
        setError('Login failed. No token received.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
   
    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      
      const phoneDigits = signUpData.phone.replace(/\D/g, '');
      const { data } = await adminAxios.post('/admin/signup', {
        store_name: signUpData.storeName,
        address: signUpData.address,
        city: signUpData.city,
        state: signUpData.state,
        pincode: signUpData.pincode,
        phone: phoneDigits,
        admin_name: signUpData.adminName,
        email: signUpData.email,
        password: signUpData.password,
      });
      const token = data.access_token ?? data.token;
      if (token) {
        setAdminToken(token);
        navigate('/admin/dashboard');
      } else {
        setError('Sign up failed. No token received.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-container">
        <div className="admin-auth-tabs">
          <button
            type="button"
            className={`admin-auth-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => { setMode('signin'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`admin-auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="admin-auth-error">{error}</div>}

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="admin-auth-form">
            <div className="admin-auth-field">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={signInData.email}
                onChange={handleSignInChange}
                required
                disabled={loading}
              />
            </div>
            <div className="admin-auth-field">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={signInData.password}
                onChange={handleSignInChange}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="admin-auth-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="admin-auth-form">
            <div className="admin-auth-field">
              <input
                type="text"
                name="storeName"
                placeholder="Store Name"
                value={signUpData.storeName}
                onChange={handleSignUpChange}
                required
                disabled={loading}
              />
            </div>
            <div className="admin-auth-field">
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={signUpData.address}
                onChange={handleSignUpChange}
                required
                disabled={loading}
              />
            </div>
            <div className="admin-auth-field">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={signUpData.city}
                onChange={handleSignUpChange}
                required
                disabled={loading}
              />
            </div>
            <div className="admin-auth-field">
              <input
                type="text"
                name="state"
                placeholder="State"
                value={signUpData.state}
                onChange={handleSignUpChange}
                required
                disabled={loading}
              />
            </div>
            <div className="admin-auth-field">
              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                value={signUpData.pincode}
                onChange={handleSignUpChange}
                required
                disabled={loading}
              />
            </div>
            <div className="admin-auth-field">
              <input
                type="tel"
                name="phone"
                placeholder="phone number"
                value={signUpData.phone}
                onChange={handleSignUpChange}
                maxLength={14}
                required
                disabled={loading}
              />
            </div>
            <div className="admin-auth-field">
              <input
                type="text"
                name="adminName"
                placeholder="Admin Name"
                value={signUpData.adminName}
                onChange={handleSignUpChange}
                required
                disabled={loading}
              />
            </div>
            <div className="admin-auth-field">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={signUpData.email}
                onChange={handleSignUpChange}
                required
                disabled={loading}
              />
            </div>
            <div className="admin-auth-field">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={signUpData.password}
                onChange={handleSignUpChange}
                required
                disabled={loading}
              />
            </div>
            <div className="admin-auth-field">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={signUpData.confirmPassword}
                onChange={handleSignUpChange}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="admin-auth-submit" disabled={loading}>
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminAuth;
