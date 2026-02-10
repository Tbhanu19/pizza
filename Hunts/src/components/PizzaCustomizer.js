import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { sizes, crusts, toppings } from '../data/menuData';
import './PizzaCustomizer.css';

const PizzaCustomizer = ({ pizza, onClose }) => {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(sizes[1]); 
  const [selectedCrust, setSelectedCrust] = useState(crusts[0]); 
  const [selectedToppings, setSelectedToppings] = useState([]);

  const calculatePrice = () => {
    const basePrice = pizza.basePrice;
    const sizePrice = selectedSize.price;
    const crustPrice = selectedCrust.price;
    const toppingsPrice = selectedToppings.reduce((sum, topping) => sum + topping.price, 0);
    return basePrice + sizePrice + crustPrice + toppingsPrice;
  };

  const handleToppingToggle = (topping) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.name === topping.name);
      if (exists) {
        return prev.filter((t) => t.name !== topping.name);
      }
      return [...prev, topping];
    });
  };

  const handleAddToCart = () => {
    const customizations = {
      size: selectedSize,
      crust: selectedCrust,
      toppings: selectedToppings,
    };

    const cartItem = {
      id: pizza.id,
      name: pizza.name,
      price: calculatePrice(),
      image: pizza.image,
      customizations,
    };

    addToCart(cartItem);
    onClose();
  };

  return (
    <div className="customizer-overlay" onClick={onClose}>
      <div className="customizer-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="customizer-header">
          <h2>{pizza.name}</h2>
          <p className="customizer-description">{pizza.description}</p>
        </div>

        <div className="customizer-content">
          <div className="customizer-section">
            <h3>Size</h3>
            <div className="option-grid">
              {sizes.map((size) => (
                <button
                  key={size.name}
                  className={`option-btn ${selectedSize.name === size.name ? 'selected' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  <div>{size.name}</div>
                  <div className="option-size">{size.size}</div>
                  {size.price > 0 && <div className="option-price">+${size.price.toFixed(2)}</div>}
                </button>
              ))}
            </div>
          </div>

          <div className="customizer-section">
            <h3>Crust</h3>
            <div className="option-grid">
              {crusts.map((crust) => (
                <button
                  key={crust.name}
                  className={`option-btn ${selectedCrust.name === crust.name ? 'selected' : ''}`}
                  onClick={() => setSelectedCrust(crust)}
                >
                  <div>{crust.name}</div>
                  {crust.price > 0 && <div className="option-price">+${crust.price.toFixed(2)}</div>}
                </button>
              ))}
            </div>
          </div>

          <div className="customizer-section">
            <h3>Toppings</h3>
            <div className="toppings-grid">
              {toppings.map((topping) => {
                const isSelected = selectedToppings.find((t) => t.name === topping.name);
                return (
                  <button
                    key={topping.name}
                    className={`topping-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToppingToggle(topping)}
                  >
                    <span>{topping.name}</span>
                    <span className="topping-price">+${topping.price.toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="customizer-footer">
          <button className="add-to-cart-btn" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default PizzaCustomizer;

