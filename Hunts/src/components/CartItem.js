import React from 'react';
import { useCart } from '../context/CartContext';
import './CartItem.css';

import imgSpecialtyLotsaMeat from '../assets/specialty-lotsa-meat.png';
import imgSpecialtyLoaded from '../assets/specialty-loaded.png';
import imgSpecialtyBreakfast from '../assets/specialty-breakfast.png';
import imgCheesePizza from '../assets/cheese-pizza.png';
import imgVeggiePizza from '../assets/veggie-pizza.png';

const CartItem = ({ item, index }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (change) => {
    const newQuantity = item.quantity + change;
    updateQuantity(item.id, item.customizations, newQuantity);
  };

  const handleRemove = () => {
    removeFromCart(item.id, item.customizations);
  };

  const getCustomizationLines = () => {
    const lines = [];
    const c = item.customizations;
    if (!c) return lines;
    if (c.size) lines.push({ type: 'line', label: 'Size', value: c.size.name });
    if (c.crust) lines.push({ type: 'line', label: 'Crust', value: c.crust.name });
    if (c.sauce) lines.push({ type: 'line', label: 'Sauce', value: c.sauce.name });
    if (c.cheese) lines.push({ type: 'line', label: 'Cheese', value: c.cheese.name });
    if (c.cheeses?.length > 0) lines.push({ type: 'line', label: 'Cheese', value: c.cheeses.map((t) => t.name).join(', ') });
    const meats = c.meats?.length > 0 ? c.meats.map((t) => t.name).join(', ') : null;
    const veggies = c.veggies?.length > 0 ? c.veggies.map((t) => t.name).join(', ') : null;
    if (meats && veggies) {
      lines.push({ type: 'line', label: 'Toppings', value: [meats, veggies].join(' • ') });
    } else if (meats) {
      lines.push({ type: 'line', label: 'Toppings', value: meats });
    } else if (veggies) {
      lines.push({ type: 'line', label: 'Toppings', value: veggies });
    }
    if (c.toppings?.length > 0) lines.push({ type: 'line', label: 'Toppings', value: `${c.toppings.length} topping(s)` });
    const extraToppings = c.extraToppings ?? c.extra_toppings;
    const extraCheeses = c.extraCheeses ?? c.extra_cheeses;
    const extraVeggies = c.extraVeggies ?? c.extra_veggies;
    if (extraToppings?.length > 0) lines.push({ type: 'extraList', label: 'Extra toppings', items: extraToppings });
    if (extraCheeses?.length > 0) lines.push({ type: 'extraList', label: 'Extra cheese', items: extraCheeses });
    if (extraVeggies?.length > 0) lines.push({ type: 'extraList', label: 'Extra veggies', items: extraVeggies });
    if (c.description) lines.push({ type: 'line', label: '', value: c.description });
    return lines;
  };

  const isImageUrl = typeof item.image === 'string' && item.image.length > 1 && (item.image.startsWith('/') || item.image.startsWith('http') || item.image.includes('media'));
  const displayImage = (() => {
    if (isImageUrl) return item.image;
    const name = (item.name || '').toLowerCase();
    if (name.includes('wingbites')) return `${process.env.PUBLIC_URL || ''}/wingbites.png`;
    if (name.includes('wing')) return `${process.env.PUBLIC_URL || ''}/wings.png`;
    if (name.includes('lotsa meat')) return imgSpecialtyLotsaMeat;
    if (name === 'loaded' || name.includes('loaded pizza')) return imgSpecialtyLoaded;
    if (name.includes('breakfast')) return imgSpecialtyBreakfast;
    if (name.includes('cheese pizza')) return imgCheesePizza;
    if (name.includes('veggie pizza')) return imgVeggiePizza;
    return null;
  })();

  return (
    <div className="cart-item">
      <div className="cart-item-image">
        {displayImage ? <img src={displayImage} alt="" /> : (item.image || '🍕')}
      </div>
      <div className="cart-item-details">
        <h3 className="cart-item-name">{item.name}</h3>
        <div className="cart-item-customizations">
          {getCustomizationLines().map((line, i) => (
            line.type === 'extraList' ? (
              <div key={i} className="cart-item-extra-section">
                <div className="cart-item-detail-line">
                  <span className="cart-item-detail-label">{line.label}:</span>
                </div>
                <ul className="cart-item-extra-list">
                  {line.items.map((t, j) => {
                    const name = t.name ?? t.topping_name ?? t.cheese_name ?? '';
                    const price = Number(t.price) ?? 0;
                    return (
                      <li key={j} className="cart-item-extra-item">
                        • {name} (+${price.toFixed(2)})
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div key={i} className="cart-item-detail-line">
                {line.label ? <span className="cart-item-detail-label">{line.label}: </span> : null}
                <span className="cart-item-detail-value">{line.value}</span>
              </div>
            )
          ))}
        </div>
        <p className="cart-item-unit-price">${(Number(item.price) || 0).toFixed(2)} each</p>
        <div className="cart-item-actions">
          <button className="remove-btn" onClick={handleRemove}>
            Remove
          </button>
        </div>
      </div>
      <div className="cart-item-quantity">
        <button
          className="quantity-btn"
          onClick={() => handleQuantityChange(-1)}
          disabled={item.quantity <= 1}
        >
          −
        </button>
        <span className="quantity-value">{item.quantity}</span>
        <button
          className="quantity-btn"
          onClick={() => handleQuantityChange(1)}
        >
          +
        </button>
      </div>
      <div className="cart-item-price">
        ${(item.price * item.quantity).toFixed(2)}
      </div>
    </div>
  );
};

export default CartItem;

