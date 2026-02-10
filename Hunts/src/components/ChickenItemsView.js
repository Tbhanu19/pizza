import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { api } from '../api';
import './PizzaCustomizer.css';
import './ChickenItemsView.css';

const WINGBITES_IMAGE = `${process.env.PUBLIC_URL || ''}/wingbites.png`;
const WINGS_IMAGE = `${process.env.PUBLIC_URL || ''}/wings.png`;
const CHICKEN_IMAGE_FALLBACK = `${process.env.PUBLIC_URL || ''}/chicken.png`;

function getChickenImage(item) {
  return (item.name || '').toLowerCase().includes('wingbites') ? WINGBITES_IMAGE : WINGS_IMAGE;
}

const FALLBACK_ITEMS = [
  { id: 'southern-wings', name: 'Southern Style Wings', basePrice: 0, image: '' },
  { id: 'hot-spicy-wings', name: 'Hot n Spicy Wings', basePrice: 0, image: '' },
  { id: 'homestyle-bites', name: 'Homestyle WingBites', basePrice: 0, image: '' },
  { id: 'buffalo-bites', name: 'Buffalo WingBites', basePrice: 0, image: '' },
];

const ChickenItemsView = ({ onClose }) => {
  const { addToCart } = useCart();
  const [items, setItems] = useState(FALLBACK_ITEMS);
  const [loading, setLoading] = useState(api.isConfigured());

  useEffect(() => {
    if (!api.isConfigured()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api.getProducts({ type: 'chicken' }).then((list) => {
      if (!cancelled && Array.isArray(list)) {
        setItems(list.map((p) => ({ id: p.id, name: p.name, basePrice: p.base_price ?? 0, image: p.image || '🍗' })));
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
      price: item.basePrice,
      image: getChickenImage(item),
      menu_item_id: typeof item.id === 'number' ? item.id : undefined,
      customizations: {},
    });
    onClose();
  };

  return (
    <div className="customizer-overlay" onClick={onClose}>
      <div className="customizer-modal chicken-items-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" type="button" onClick={onClose}>×</button>
        <div className="customizer-header byo-header">
          <h2 className="byo-title">Chicken</h2>
          <p className="byo-subtitle">Wings &amp; WingBites</p>
        </div>
        {loading ? (
          <div className="chicken-items-loading">Loading...</div>
        ) : (
          <div className="chicken-items-grid">
            {items.map((item) => (
              <div key={item.id} className="chicken-item-card">
                <div className="chicken-item-image">
                  <img
                    src={getChickenImage(item)}
                    alt={item.name}
                    onError={(e) => {
                      const el = e.target;
                      if (el.dataset.triedFallback) {
                        el.style.display = 'none';
                        el.nextSibling?.classList.add('visible');
                      } else {
                        el.dataset.triedFallback = '1';
                        el.src = CHICKEN_IMAGE_FALLBACK;
                      }
                    }}
                  />
                  <span className="chicken-item-image-fallback">{item.image}</span>
                </div>
                <div className="chicken-item-info">
                  <h3 className="chicken-item-name">{item.name}</h3>
                  <button
                    type="button"
                    className="customize-btn chicken-add-btn"
                    onClick={() => handleAddToCart(item)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChickenItemsView;
