import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminAxios from './adminAxios';
import './AdminProfile.css';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [personal, setPersonal] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [store, setStore] = useState({
    storeName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await adminAxios.get('/admin/me');
        if (data) {
          setPersonal({
            name: data.name ?? data.admin_name ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
          });
          const s = data.store ?? data;
          setStore({
            storeName: s?.store_name ?? s?.name ?? '',
            address: s?.address ?? '',
            city: s?.city ?? '',
            state: s?.state ?? '',
            pincode: s?.pincode ?? '',
            phone: s?.phone ?? '',
          });
        }
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/admin');
          return;
        }
        setError(err.response?.data?.detail || err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonal((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleStoreChange = (e) => {
    const { name, value } = e.target;
    setStore((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminAxios.patch('/admin/me', {
        name: personal.name,
        email: personal.email,
        phone: personal.phone,
        store: {
          store_name: store.storeName,
          address: store.address,
          city: store.city,
          state: store.state,
          pincode: store.pincode,
          phone: store.phone,
        },
      });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/admin');
        return;
      }
      setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-profile">
        <div className="admin-profile-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-profile">
      <h1 className="admin-profile-title">Profile & Store Details</h1>
      {error && <div className="admin-profile-error">{error}</div>}
      {success && <div className="admin-profile-success">{success}</div>}

      <form onSubmit={handleSubmit} className="admin-profile-form">
        <section className="admin-profile-section">
          <h2>Personal Details</h2>
          <div className="admin-profile-fields">
            <div className="admin-profile-field">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={personal.name}
                onChange={handlePersonalChange}
              />
            </div>
            <div className="admin-profile-field">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={personal.email}
                onChange={handlePersonalChange}
              />
            </div>
            <div className="admin-profile-field">
              <input
                type="tel"
                name="phone"
                placeholder="Phone"
                value={personal.phone}
                onChange={handlePersonalChange}
              />
            </div>
          </div>
        </section>

        <section className="admin-profile-section">
          <h2>Store Details</h2>
          <div className="admin-profile-fields">
            <div className="admin-profile-field">
              <input
                type="text"
                name="storeName"
                placeholder="Store Name"
                value={store.storeName}
                onChange={handleStoreChange}
              />
            </div>
            <div className="admin-profile-field">
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={store.address}
                onChange={handleStoreChange}
              />
            </div>
            <div className="admin-profile-field">
              <input
                type="text"
                name="city"
                placeholder="City"
                value={store.city}
                onChange={handleStoreChange}
              />
            </div>
            <div className="admin-profile-field">
              <input
                type="text"
                name="state"
                placeholder="State"
                value={store.state}
                onChange={handleStoreChange}
              />
            </div>
            <div className="admin-profile-field">
              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                value={store.pincode}
                onChange={handleStoreChange}
              />
            </div>
            <div className="admin-profile-field">
              <input
                type="tel"
                name="phone"
                placeholder="Store Phone"
                value={store.phone}
                onChange={handleStoreChange}
              />
            </div>
          </div>
        </section>

        <button type="submit" className="admin-profile-submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default AdminProfile;
