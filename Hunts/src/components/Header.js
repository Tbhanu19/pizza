import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLocationContext } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import LocationSelector from './LocationSelector';
import SignIn from './SignIn';
import './Header.css';

const Header = () => {
  const { getTotalItems } = useCart();
  const { selectedLocation } = useLocationContext();
  const { user, logout, signInRequested } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const totalItems = getTotalItems();
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    if (showUserDropdown) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserDropdown]);

  useEffect(() => {
    if (location.state?.showSignIn) {
      setShowSignIn(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.showSignIn, location.pathname, navigate]);

  useEffect(() => {
    if (signInRequested > 0) setShowSignIn(true);
  }, [signInRequested]);

  const getLocationDisplay = () => {
    if (selectedLocation) {
      if (selectedLocation.isCurrent) return 'Current Location';
      if (selectedLocation.store_name) return selectedLocation.store_name;
      if (selectedLocation.city || selectedLocation.state) {
        return [selectedLocation.city, selectedLocation.state].filter(Boolean).join(', ');
      }
      return selectedLocation.address || 'Location selected';
    }
    return 'Choose your location';
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src={`${process.env.PUBLIC_URL || ''}/hunt-brothers-logo.png`} alt="Hunt Brothers Pizza" className="logo-img" />
          </Link>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}>
              Home
            </Link>
            <Link to="/menu" className={location.pathname === '/menu' ? 'nav-link active' : 'nav-link'}>
              Menu
            </Link>
            <div className="header-actions">
              <button
                className="location-btn"
                onClick={() => setShowLocationSelector(true)}
              >
                <span className="location-icon">📍</span>
                <span className="location-text">{getLocationDisplay()}</span>
              </button>
              {user ? (
                <div className="user-menu" ref={userMenuRef}>
                  <button
                    type="button"
                    className="user-icon-btn"
                    onClick={() => setShowUserDropdown((v) => !v)}
                    aria-label="User menu"
                    aria-expanded={showUserDropdown}
                  >
                    <span className="user-icon">👤</span>
                  </button>
                  {showUserDropdown && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-name">
                        {user.name || user.email.split('@')[0]}
                      </div>
                      <Link
                        to="/orders"
                        className="user-dropdown-item"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        Orders
                      </Link>
                      <Link
                        to="/my-account"
                        className="user-dropdown-item"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        My Account
                      </Link>
                      <button
                        type="button"
                        className="user-dropdown-item user-dropdown-signout"
                        onClick={() => {
                          setShowUserDropdown(false);
                          logout();
                        }}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  className="sign-in-btn"
                  onClick={() => setShowSignIn(true)}
                >
                  Sign In
                </button>
              )}
              <Link to="/cart" className={`nav-link cart-link ${location.pathname === '/cart' ? 'active' : ''}`}>
                🛒
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </Link>
            </div>
          </nav>
        </div>
      </header>
      {showLocationSelector && (
        <LocationSelector onClose={() => setShowLocationSelector(false)} />
      )}
      {showSignIn && (
        <SignIn onClose={() => setShowSignIn(false)} />
      )}
    </>
  );
};

export default Header;

