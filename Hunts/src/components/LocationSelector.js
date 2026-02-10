import React, { useState, useEffect, useCallback } from 'react';
import { useLocationContext } from '../context/LocationContext';
import { api } from '../api';
import './LocationSelector.css';

const RADIUS_OPTIONS = [
  { value: '', label: 'Select a radius' },
  { value: 5, label: '5 Miles' },
  { value: 10, label: '10 Miles' },
  { value: 15, label: '15 Miles' },
  { value: 20, label: '20 Miles' },
];

const LocationSelector = ({ onClose }) => {
  const { selectedLocation, selectLocation } = useLocationContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusMiles, setRadiusMiles] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const runSearch = useCallback(async (query, radius) => {
    const q = (query || '').trim();
    if (!q) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    if (!api.isConfigured()) {
      setSearchResults([]);
      setSearchError('Location search is not connected. Set REACT_APP_API_URL to your backend.');
      return;
    }
    setLoading(true);
    setSearchError('');
    try {
      const data = await api.searchLocations(q, radius || null);
      let list = Array.isArray(data) ? data : [];
      const numRadius = radius ? Number(radius) : null;
      if (numRadius != null && numRadius > 0) {
        list = list.filter((store) => {
          const dist = store.distance_miles ?? store.distance;
          if (dist == null) return true;
          return Number(dist) <= numRadius;
        });
      }
      setSearchResults(list);
    } catch (err) {
      setSearchResults([]);
      setSearchError(err.detail || err.message || 'Search failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(searchQuery, radiusMiles || null), 300);
    return () => clearTimeout(t);
  }, [searchQuery, radiusMiles, runSearch]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectLocation = (store) => {
    selectLocation({
      id: store.id,
      store_name: store.store_name,
      address: store.address,
      area: store.area,
      city: store.city,
      state: store.state,
      pincode: store.pincode,
      phone: store.phone,
      opening_time: store.opening_time,
      closing_time: store.closing_time,
      isCurrent: false,
    });
    onClose();
  };

  const handleUseCurrentLocation = () => {
    selectLocation({
      id: 'current',
      address: 'Current Location',
      city: 'Detected',
      state: '',
      pincode: '',
      phone: '',
      store_name: 'Current Location',
      isCurrent: true,
    });
    onClose();
  };

  const formatAddress = (store) => {
    const parts = [store.address];
    if (store.area) parts.push(store.area);
    parts.push([store.city, store.state].filter(Boolean).join(', '));
    if (store.pincode) parts.push(store.pincode);
    return parts.filter(Boolean).join(' · ');
  };

  const formatTimings = (store) => {
    if (store.opening_time && store.closing_time) {
      return `${store.opening_time} – ${store.closing_time}`;
    }
    if (store.opening_time) return `Opens ${store.opening_time}`;
    if (store.closing_time) return `Closes ${store.closing_time}`;
    return null;
  };

  return (
    <div className="location-selector-overlay" onClick={onClose}>
      <div className="location-selector-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="location-selector-header">
          <h2>Choose Your Location</h2>
          <p>Select a location to see menu and delivery options</p>
        </div>

        <div className="location-selector-content">
          <div className="search-section">
            <div className="location-search-row">
              <div className="search-input-wrapper">
                <span className="search-icon">📍</span>
                <input
                  type="text"
                  placeholder="Enter address, city, or zip code"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="location-search-input"
                />
              </div>
              <select
                className="radius-select"
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(e.target.value)}
                aria-label="Select a radius"
              >
                {RADIUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {loading && (
              <div className="location-search-loading">Searching stores…</div>
            )}
            {searchError && (
              <div className="location-search-error">{searchError}</div>
            )}
            {!loading && !searchError && searchResults.length > 0 && (
              <div className="location-cards">
                {searchResults.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    className="location-store-card"
                    onClick={() => handleSelectLocation(store)}
                  >
                    <div className="location-store-name">{store.store_name}</div>
                    {(store.distance_miles != null || store.distance != null) && (
                      <div className="location-store-distance">
                        {(store.distance_miles ?? store.distance).toFixed(2)} miles
                      </div>
                    )}
                    <div className="location-store-address">{formatAddress(store)}</div>
                    {store.phone && (
                      <div className="location-store-phone">📞 {store.phone}</div>
                    )}
                    {formatTimings(store) && (
                      <div className="location-store-timings">🕐 {formatTimings(store)}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
            {!loading && searchQuery.trim() && searchResults.length === 0 && !searchError && (
              <div className="no-results">No stores found. Try another search.</div>
            )}
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <button className="current-location-btn" onClick={handleUseCurrentLocation}>
            <span>📍</span>
            Use Current Location
          </button>

          {selectedLocation && (
            <div className="current-selection">
              <h3>Current Selection:</h3>
              <div className="selected-location">
                <div className="location-icon">📍</div>
                <div className="location-details">
                  {selectedLocation.isCurrent ? (
                    <>
                      <div className="location-address">Current Location</div>
                      <div className="location-city">Detected</div>
                    </>
                  ) : (
                    <>
                      <div className="location-address">
                        {selectedLocation.store_name || selectedLocation.address}
                      </div>
                      <div className="location-city">
                        {selectedLocation.address}
                        {[selectedLocation.city, selectedLocation.state].filter(Boolean).length > 0 && (
                          <> · {[selectedLocation.city, selectedLocation.state].filter(Boolean).join(', ')}</>
                        )}
                        {selectedLocation.pincode && ` ${selectedLocation.pincode}`}
                      </div>
                      {selectedLocation.phone && (
                        <div className="location-city">📞 {selectedLocation.phone}</div>
                      )}
                      {selectedLocation.opening_time && selectedLocation.closing_time && (
                        <div className="location-city">
                          🕐 {selectedLocation.opening_time} – {selectedLocation.closing_time}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
