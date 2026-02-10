import React from 'react';
import './PizzaCard.css';

const isImageUrl = (src) => typeof src === 'string' && src.length > 1 && (src.startsWith('http') || src.startsWith('/') || src.includes('media'));

const PizzaCard = ({ pizza, onSelect }) => {
  return (
    <div className="pizza-card">
      <div className="pizza-image">
        {pizza.image && isImageUrl(pizza.image) ? <img src={pizza.image} alt="" /> : pizza.image}
      </div>
      <div className="pizza-info">
        <h3 className="pizza-name">{pizza.name}</h3>
        <p className="pizza-description">{pizza.description}</p>
        <div className="pizza-footer">
          <span className="pizza-price">From ${pizza.basePrice.toFixed(2)}</span>
          <button className="customize-btn" onClick={() => onSelect(pizza)}>
            {pizza.name === 'Build your own' ? 'Customize' : 'View Items'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PizzaCard;

