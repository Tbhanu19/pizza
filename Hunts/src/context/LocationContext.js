import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const savedLocation = localStorage.getItem('pizzaLocation');
    if (savedLocation) {
      setSelectedLocation(JSON.parse(savedLocation));
    }
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem('pizzaLocation', JSON.stringify(selectedLocation));
    }
  }, [selectedLocation]);

  const selectLocation = (location) => {
    setSelectedLocation(location);
  };

  const value = {
    selectedLocation,
    selectLocation,
  };

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

