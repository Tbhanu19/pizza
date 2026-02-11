import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { getToppingImageForItem } from '../constants/toppingImages';
import './PizzaCustomizer.css';
import './BuildYourOwnCustomizer.css';

const CRUSTS = [
  { name: 'Original Crust', sublabel: null, image: '', price: 0 },
  { name: 'Thin Crust', sublabel: '12" Medium', image: '', price: 0 },
];

const CHEESES = [
  { name: 'Mozzarella', image: '', price: 0 },
  { name: 'Cheddar', image: '', price: 0 },
];

const EXTRA_CHEESE_OPTIONS = [
  { name: 'Extra Mozzarella', image: '', price: 0 },
  { name: 'Extra Cheddar', image: '', price: 0 },
];

const OptionCard = ({ item, isSelected, onSelect, sublabel, showPrice, imageSrc }) => (
  <button
    type="button"
    className={`byo-option-card ${isSelected ? 'selected' : ''}`}
    onClick={onSelect}
  >
    <span className="byo-check">✓</span>
    <div className="byo-card-image">
      {imageSrc ? <img src={imageSrc} alt={item.name} /> : (item.image || null)}
    </div>
    <div className="byo-card-label">
      {item.name}
      {sublabel && <div className="byo-card-sublabel">{sublabel}</div>}
      {showPrice && <span className="byo-card-price">+${(item.price ?? 0).toFixed(2)}</span>}
    </div>
  </button>
);

const CheesePizzaView = ({ pizza, onClose }) => {
  const { addToCart } = useCart();
  const [selectedCrust, setSelectedCrust] = useState(CRUSTS[0]);
  const [selectedCheeses, setSelectedCheeses] = useState([...CHEESES]);
  const [selectedExtraCheese, setSelectedExtraCheese] = useState([]);

  const toggleMulti = (item, selectedList, setter) => {
    setter((prev) => {
      const exists = prev.find((t) => t.name === item.name);
      if (exists) return prev.filter((t) => t.name !== item.name);
      return [...prev, item];
    });
  };

  const calculatePrice = () => {
    const base = pizza.basePrice ?? 0;
    const extraCheese = selectedExtraCheese.reduce((s, t) => s + (t.price ?? 0), 0);
    return base + extraCheese;
  };

  const handleAddToCart = () => {
    addToCart({
      id: `vegeterian-${pizza.id}-${Date.now()}`,
      name: pizza.name,
      price: calculatePrice(),
      image: pizza.image,
      customizations: {
        crust: selectedCrust,
        cheeses: selectedCheeses,
        extraCheeses: selectedExtraCheese,
      },
    });
    onClose();
  };

  return (
    <div className="customizer-overlay" onClick={onClose}>
      <div className="customizer-modal build-your-own-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" type="button" onClick={onClose}>×</button>

        <div className="customizer-content byo-content-no-header">
          <div className="byo-section">
            <h3 className="byo-section-label">Crust</h3>
            <div className="byo-options-row">
              {CRUSTS.map((c) => (
                <OptionCard
                  key={c.name}
                  item={c}
                  imageSrc={getToppingImageForItem(c)}
                  isSelected={selectedCrust?.name === c.name}
                  onSelect={() => setSelectedCrust(c)}
                  sublabel={c.sublabel}
                />
              ))}
            </div>
          </div>

          <div className="byo-section">
            <h3 className="byo-section-label">Cheese</h3>
            <div className="byo-options-row">
              {CHEESES.map((c) => {
                const isSelected = selectedCheeses.some((t) => t.name === c.name);
                return (
                  <OptionCard
                    key={c.name}
                    item={c}
                    imageSrc={getToppingImageForItem(c)}
                    isSelected={isSelected}
                    onSelect={() => toggleMulti(c, selectedCheeses, setSelectedCheeses)}
                  />
                );
              })}
            </div>
          </div>

          <div className="byo-section">
            <h3 className="byo-section-label">Extra Cheese</h3>
            <div className="byo-options-row">
              {EXTRA_CHEESE_OPTIONS.map((t) => {
                const isSelected = selectedExtraCheese.some((x) => x.name === t.name);
                return (
                  <OptionCard
                    key={t.name}
                    item={t}
                    imageSrc={getToppingImageForItem(t)}
                    isSelected={isSelected}
                    onSelect={() => toggleMulti(t, selectedExtraCheese, setSelectedExtraCheese)}
                    showPrice
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="added-items-box">
          <h4 className="added-items-title">Added items</h4>
          <div className="added-items-list">
            {selectedCrust && (
              <button type="button" className="added-item-tag" onClick={() => setSelectedCrust(CRUSTS[0])} title="Reset">
                {selectedCrust.name} <span className="added-item-remove">×</span>
              </button>
            )}
            {selectedCheeses.map((c) => (
              <button key={c.name} type="button" className="added-item-tag" onClick={() => toggleMulti(c, selectedCheeses, setSelectedCheeses)} title="Remove">
                {c.name} <span className="added-item-remove">×</span>
              </button>
            ))}
            {selectedExtraCheese.map((t) => (
              <button key={t.name} type="button" className="added-item-tag" onClick={() => setSelectedExtraCheese((prev) => prev.filter((x) => x.name !== t.name))} title="Remove">
                {t.name} +${(t.price ?? 0).toFixed(2)} <span className="added-item-remove">×</span>
              </button>
            ))}
          </div>
        </div>

        <div className="customizer-footer byo-footer">
          <button type="button" className="byo-add-btn" onClick={handleAddToCart}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheesePizzaView;
