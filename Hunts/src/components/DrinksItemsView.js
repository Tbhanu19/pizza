import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { api } from '../api';
import './PizzaCustomizer.css';
import './DrinksItemsView.css';

import imgCocaCola from '../assets/drink-coca-cola.png';
import imgPepsi from '../assets/drink-pepsi.png';
import imgSprite from '../assets/drink-sprite.png';
import imgFanta from '../assets/drink-fanta.png';

const DRINK_IMAGES = {
  'Coca-Cola': imgCocaCola,
  'Coke': imgCocaCola,
  'Pepsi': imgPepsi,
  'Sprite': imgSprite,
  'Fanta': imgFanta,
};

function getDrinkImage(item) {
  return DRINK_IMAGES[item.name] ?? null;
}

const FALLBACK_ITEMS = [
  { id: 101, name: 'Coca-Cola', description: 'Classic 20oz bottle', basePrice: 0, image: '🥤' },
  { id: 102, name: 'Pepsi', description: 'Classic 20oz bottle', basePrice: 0, image: '🥤' },
  { id: 103, name: 'Sprite', description: 'Lemon-lime 20oz bottle', basePrice: 0, image: '🥤' },
  { id: 104, name: 'Fanta', description: 'Orange 20oz bottle', basePrice: 0, image: '🥤' },
];

const DrinksItemsView = ({ onClose }) => {
  const { addToCart } = useCart();
  const [items, setItems] = useState(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(api.isConfigured());

  useEffect(() => {
    if (!api.isConfigured()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api.getProducts({ type: 'drink' }).then((list) => {
      if (!cancelled && Array.isArray(list)) {
        setItems(list.map((p) => {
          const rawName = (p.name || '').trim();
          const name = rawName === 'Water' ? 'Fanta' : rawName === 'Coke' ? 'Coca-Cola' : rawName;
          const description = rawName === 'Water' ? 'Orange 20oz bottle' : (p.description || '');
          return {
            id: p.id,
            name,
            description,
            basePrice: p.base_price ?? 0,
            image: p.image || '🥤',
          };
        }));
      }
    }).catch(() => {
      if (!cancelled) setItems(FALLBACK_ITEMS);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleAddToCart = (item) => {
    addToCart({
      id: `${item.id}-${Date.now()}`,
      name: item.name,
      price: item.basePrice ?? 0,
      image: getDrinkImage(item) || item.image,
      menu_item_id: typeof item.id === 'number' ? item.id : undefined,
      customizations: {},
    });
    onClose();
  };

  const DrinkCard = ({ item }) => {
    const imageSrc = getDrinkImage(item);
    return (
      <div className="drinks-item-card">
        <div className="drinks-item-image">
          {imageSrc ? <img src={imageSrc} alt={item.name} /> : <span className="drinks-item-emoji">{item.image}</span>}
        </div>
        <div className="drinks-item-info">
          <h3 className="drinks-item-name">{item.name}</h3>
          {item.description && <p className="drinks-item-description">{item.description}</p>}
          <button type="button" className="customize-btn drinks-add-btn" onClick={() => handleAddToCart(item)}>
            Add to Cart
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="customizer-overlay" onClick={onClose}>
      <div className="customizer-modal drinks-items-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" type="button" onClick={onClose}>×</button>
        {loading ? (
          <div className="drinks-items-loading">Loading...</div>
        ) : (
          <div className="drinks-items-grid">
            {items.map((item) => <DrinkCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DrinksItemsView;
