import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SignIn.css';

const SignIn = ({ onClose }) => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: formatted,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (isSignUp && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (isSignUp && !formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (isSignUp && formData.phone.trim()) {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        newErrors.phone = 'Phone number must be 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, submit: '' }));

    const SUBMIT_TIMEOUT_MS = 25000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out. Please try again.')), SUBMIT_TIMEOUT_MS);
    });

    try {
      let result;
      if (isSignUp) {
        const phoneDigits = formData.phone.replace(/\D/g, '');
        await Promise.race([
          signup(formData.name, formData.email, formData.password, phoneDigits),
          timeoutPromise,
        ]);
        setErrors({ submit: 'Account created. You can sign in now.' });
      } else {
        result = await Promise.race([
          login(formData.email, formData.password),
          timeoutPromise,
        ]);
        if (result && result.success) {
          onClose();
          navigate('/');
        } else {
          setErrors({ submit: 'Login failed. Please try again.' });
        }
      }
    } catch (err) {
      console.error('SignIn error:', err);
      const errorMsg = err.detail || err.message || err.response?.data?.detail || 'Request failed. Please try again.';
      setErrors({ submit: typeof errorMsg === 'string' ? errorMsg : 'Request failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signin-overlay" onClick={onClose}>
      <div className="signin-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="signin-header">
          <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>
          <p>{isSignUp ? 'Join Hunt Brothers Pizza to get exclusive deals' : 'Welcome back!'}</p>
        </div>

        <form className="signin-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="Enter your full name"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? 'error' : ''}
                placeholder="Enter your phone number"
                maxLength={14}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {errors.submit && (
            <div className={errors.submit === 'Account created. You can sign in now.' ? 'success-message submit-message' : 'error-message submit-error'}>
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="signin-footer">
          <p>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              className="toggle-form-btn"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
                setFormData({ name: '', email: '', password: '', phone: '' });
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;

