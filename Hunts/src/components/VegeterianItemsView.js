import React, { useState, useEffect } from 'react';
import VegeterianPizzaCustomizer from './VegeterianPizzaCustomizer';
import CheesePizzaView from './CheesePizzaView';
import { api } from '../api';
import './PizzaCustomizer.css';
import './VegeterianItemsView.css';

import imgCheesePizza from '../assets/cheese-pizza.png';
import imgVeggiePizza from '../assets/veggie-pizza.png';

const FALLBACK_ITEMS = [
  { id: 'cheese-pizza', name: 'Cheese Pizza', basePrice: 0, image: '🍕', description: 'Meat-free options only. Choose crust, add more cheese, extra veggie toppings.' },
  { id: 'veggie-pizza', name: 'Veggie Pizza', basePrice: 0, image: '🍕', description: 'Meat-free options only. Choose crust, add more cheese, extra veggie toppings.' },
];

function getVegeterianItemImage(item) {
  const id = (item.id || '').toString().toLowerCase();
  const name = (item.name || '').toLowerCase();
  if (id === 'cheese-pizza' || name === 'cheese pizza' || name.includes('cheese pizza')) return imgCheesePizza;
  if (id === 'veggie-pizza' || name === 'veggie pizza' || name.includes('veggie')) return imgVeggiePizza;
  return null;
}

const VegeterianItemsView = ({ onClose }) => {
  const [items, setItems] = useState(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(api.isConfigured());
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    if (!api.isConfigured()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api.getCategories().then((cats) => {
      const veg = (cats || []).find((c) => c.name === 'Vegetarian');
      if (!veg) return Promise.resolve([]);
      return api.getProducts({ category_id: veg.id });
    }).then((list) => {
      if (!cancelled && Array.isArray(list)) {
        setItems(list.map((p) => ({
          id: p.id,
          name: p.name,
          basePrice: p.base_price ?? 0,
          image: p.image || '🍕',
          description: p.description || 'Meat-free options only. Choose crust, add more cheese, extra veggie toppings.',
        })));
      }
    }).catch(() => {
      if (!cancelled) setItems(FALLBACK_ITEMS);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleCustomize = (item) => {
    setActiveItem(item);
  };

  const handleCloseCustomizer = () => {
    setActiveItem(null);
  };

  if (activeItem) {
    const isCheesePizza = activeItem.id === 'cheese-pizza' || (activeItem.name || '').toLowerCase() === 'cheese pizza';
    if (isCheesePizza) {
      return <CheesePizzaView pizza={activeItem} onClose={handleCloseCustomizer} />;
    }
    return (
      <VegeterianPizzaCustomizer
        pizza={activeItem}
        onClose={handleCloseCustomizer}
      />
    );
  }

  return (
    <div className="customizer-overlay" onClick={onClose}>
      <div className="customizer-modal vegeterian-items-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" type="button" onClick={onClose}>×</button>
        {loading ? (
          <div className="vegeterian-items-loading">Loading...</div>
        ) : (
          <div className="vegeterian-items-grid">
            {items.map((item) => {
              const imageSrc = getVegeterianItemImage(item);
              return (
              <div key={item.id} className="vegeterian-item-card">
                <div className="vegeterian-item-image">
                  {imageSrc ? (
                    <img src={imageSrc} alt={item.name} />
                  ) : (
                    <span className="vegeterian-item-emoji">{item.image}</span>
                  )}
                </div>
                <div className="vegeterian-item-info">
                  <h3 className="vegeterian-item-name">{item.name}</h3>
                  <p className="vegeterian-item-description">{item.description}</p>
                  <div className="vegeterian-item-footer">
                    <button type="button" className="customize-btn" onClick={() => handleCustomize(item)}>
                      Customize
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VegeterianItemsView;
