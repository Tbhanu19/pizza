import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { api } from '../api';
import SpecialtyPizzaCustomizer from './SpecialtyPizzaCustomizer';
import LoadedPizzaCustomizer from './LoadedPizzaCustomizer';
import './PizzaCustomizer.css';
import './SpecialityItemsView.css';

import imgLotsaMeat from '../assets/specialty-lotsa-meat.png';
import imgLoaded from '../assets/specialty-loaded.png';
import imgBreakfast from '../assets/specialty-breakfast.png';

const FALLBACK_ITEMS = [
  { id: 'lotsa-meat', name: 'Lotsa Meat Pizza', basePrice: 0, image: '🍕', hasVeggies: true, description: "A pizza that lives up to its name, our specialty Lotsa Meat Pizza is topped with mouth-watering Italian sausage, savory beef, tender bacon, and zesty pepperoni." },
  { id: 'loaded', name: 'Loaded', basePrice: 0, image: '🍕', hasVeggies: true, description: "You won't make it to the car without a bite. Our Loaded Pizza is topped generously with Italian sausage, delicious pepperoni, chunks of bacon, savory beef, bell peppers, mushrooms, onions, black olives, banana peppers and jalapeños for added kick." },
  { id: 'breakfast', name: 'Breakfast', basePrice: 0, image: '🍕', description: "Pizza for breakfast is good, but our specialty Breakfast Pizza baked fresh is better. Topped with fluffy scrambled eggs, chopped bacon, breakfast sausage, and of course a blend of mozzarella and cheddar, it's all there on our buttered original crust for an excellent breakfast any time, day or night." },
];

const SPECIALTY_IMAGES_BY_ID = {
  'lotsa-meat': imgLotsaMeat,
  loaded: imgLoaded,
  breakfast: imgBreakfast,
};

const SPECIALTY_IMAGES_BY_NAME = {
  'lotsa meat pizza': imgLotsaMeat,
  'lotsa meat': imgLotsaMeat,
  loaded: imgLoaded,
  breakfast: imgBreakfast,
};

function getSpecialtyImage(item) {
  let src = SPECIALTY_IMAGES_BY_ID[item.id];
  if (!src && item.name) {
    const nameKey = (item.name || '').toLowerCase().trim();
    src = SPECIALTY_IMAGES_BY_NAME[nameKey] || SPECIALTY_IMAGES_BY_NAME[nameKey.replace(/\s*pizza\s*$/, '')];
  }
  return src || null;
}

function mapSpecialty(p) {
  const hasVeggies = (p.name || '').toLowerCase().includes('loaded') || (p.name || '').toLowerCase().includes('lotsa');
  return {
    id: p.id,
    name: p.name,
    basePrice: p.base_price ?? 0,
    image: p.image || '🍕',
    hasVeggies,
    description: p.description || 'Choose crust, sauce, and add more toppings.',
  };
}

const SpecialityItemsView = ({ onClose }) => {
  const { addToCart } = useCart();
  const [items, setItems] = useState(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(api.isConfigured());
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    if (!api.isConfigured()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api.getSpecialty().then((list) => {
      if (!cancelled && Array.isArray(list)) setItems(list.map(mapSpecialty));
    }).catch(() => {
      if (!cancelled) setItems(FALLBACK_ITEMS);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleCustomize = (item) => {
    if (item.name === 'Breakfast') return;
    setActiveItem(item);
  };

  const handleBreakfastAddToCart = () => {
    const breakfast = items.find((i) => i.name === 'Breakfast');
    addToCart({
      id: breakfast ? `breakfast-${breakfast.id}` : `breakfast-${Date.now()}`,
      name: 'Breakfast',
      price: breakfast?.basePrice ?? 0,
      image: breakfast ? getSpecialtyImage(breakfast) : null,
      menu_item_id: breakfast?.id,
      customizations: breakfast ? { description: breakfast.description } : {},
    });
    onClose();
  };

  const handleCloseCustomizer = () => {
    setActiveItem(null);
  };

  const SpecialtyCard = ({ item }) => {
    const imageSrc = getSpecialtyImage(item);
    return (
      <div className="speciality-item-card">
        <div className="speciality-item-image">
          {imageSrc ? <img src={imageSrc} alt={item.name} /> : <span className="speciality-item-emoji">{item.image}</span>}
        </div>
        <div className="speciality-item-info">
          <h3 className="speciality-item-name">{item.name}</h3>
          <p className="speciality-item-description">{item.description || 'Choose crust, sauce, and add more toppings.'}</p>
          <div className="speciality-item-footer">
            {item.name === 'Breakfast' ? (
              <button type="button" className="customize-btn" onClick={handleBreakfastAddToCart}>Add to Cart</button>
            ) : (
              <button type="button" className="customize-btn" onClick={() => handleCustomize(item)}>Customize</button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (activeItem) {
    const isLoaded = activeItem.id === 'loaded' || (activeItem.name || '').toLowerCase() === 'loaded';
    if (isLoaded) {
      return (
        <LoadedPizzaCustomizer
          pizza={activeItem}
          onClose={handleCloseCustomizer}
        />
      );
    }
    return (
      <SpecialtyPizzaCustomizer
        pizza={activeItem}
        onClose={handleCloseCustomizer}
        showVeggies={activeItem.hasVeggies}
      />
    );
  }

  return (
    <div className="customizer-overlay" onClick={onClose}>
      <div className="customizer-modal speciality-items-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" type="button" onClick={onClose}>×</button>
        {loading ? (
          <div className="speciality-items-loading">Loading...</div>
        ) : (
          <div className="speciality-items-grid">
            {items.map((item) => <SpecialtyCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialityItemsView;
