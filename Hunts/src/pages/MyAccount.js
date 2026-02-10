import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './MyAccount.css';

const MyAccount = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async () => {
    const profileChanged = user && (name !== (user.name || '') || email !== (user.email || '') || (phone || '') !== (user.phone || ''));
    const passwordFilled = currentPassword || newPassword || confirmPassword;

    if (!profileChanged && !passwordFilled) {
      setMessage({ type: 'error', text: 'No changes to save.' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (profileChanged && api.isConfigured()) {
        await api.updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() });
        updateUser({ name: name.trim(), email: email.trim(), phone: phone.trim() });
        setEditName(false);
        setEditEmail(false);
      }
      if (passwordFilled) {
        if (!api.isConfigured()) {
          setMessage({ type: 'error', text: 'Password change is not available.' });
          return;
        }
        if (!currentPassword || !newPassword || !confirmPassword) {
          setMessage({ type: 'error', text: 'Fill all password fields.' });
          return;
        }
        if (newPassword.length < 8) {
          setMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
          return;
        }
        if (newPassword !== confirmPassword) {
          setMessage({ type: 'error', text: 'New password and confirm password do not match.' });
          return;
        }
        await api.changePassword({ current_password: currentPassword, new_password: newPassword });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      setMessage({ type: 'success', text: 'Your changes have been saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.detail || err.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    const profileChanged = user && (name !== (user.name || '') || email !== (user.email || '') || (phone || '') !== (user.phone || ''));
    const passwordFilled = currentPassword || newPassword || confirmPassword;
    return profileChanged || passwordFilled;
  };

  if (!user) {
    return (
      <div className="my-account-page">
        <div className="my-account-card">
          <h1>My Account</h1>
          <p>Please sign in to view your account.</p>
          <Link to="/menu" className="my-account-btn primary">Browse Menu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="my-account-page">
      <div className="my-account-container">
        <h1 className="my-account-title">My Account</h1>

        <div className="my-account-card">
          <h2 className="card-heading">Profile Details</h2>
          <p className="card-subtitle">Update your name, email, and phone.</p>

          <div className="field-row">
            <label className="field-label">Name</label>
            <div className="field-with-edit">
              {editName ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field-input"
                  placeholder="Your name"
                  autoFocus
                />
              ) : (
                <span className="field-value">{name || '—'}</span>
              )}
              <button
                type="button"
                className="edit-icon-btn"
                onClick={() => setEditName((v) => !v)}
                aria-label={editName ? 'Cancel edit' : 'Edit name'}
                title={editName ? 'Cancel' : 'Edit'}
              >
                {editName ? '✕' : '✎'}
              </button>
            </div>
          </div>

          <div className="field-row">
            <label className="field-label">Email</label>
            <div className="field-with-edit">
              {editEmail ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input"
                  placeholder="your@email.com"
                  autoFocus
                />
              ) : (
                <span className="field-value">{email || '—'}</span>
              )}
              <button
                type="button"
                className="edit-icon-btn"
                onClick={() => setEditEmail((v) => !v)}
                aria-label={editEmail ? 'Cancel edit' : 'Edit email'}
                title={editEmail ? 'Cancel' : 'Edit'}
              >
                {editEmail ? '✕' : '✎'}
              </button>
            </div>
          </div>

          <div className="field-row">
            <label className="field-label">Phone</label>
            <div className="field-with-edit">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="field-input"
                placeholder="Phone number"
              />
            </div>
          </div>
        </div>

        <div className="my-account-card">
          <h2 className="card-heading">Change Password</h2>
          <p className="card-subtitle">Enter your current password and choose a new one.</p>

          <div className="field-row">
            <label className="field-label">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="field-input"
              placeholder="Current password"
            />
          </div>
          <div className="field-row">
            <label className="field-label">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="field-input"
              placeholder="At least 8 characters"
            />
          </div>
          <div className="field-row">
            <label className="field-label">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field-input"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        {message.text && (
          <div className={`my-account-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="my-account-actions">
          <button
            type="button"
            className="my-account-btn primary save-btn"
            onClick={handleSave}
            disabled={saving || !hasChanges()}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <Link to="/" className="my-account-btn secondary">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
