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



const VEGGIES = [
  { name: 'Bell Peppers', image: '', price: 0 },
  { name: 'Mushrooms', image: '', price: 0 },
  { name: 'Onions', image: '', price: 0 },
  { name: 'Black Olives', image: '', price: 0 },
  { name: 'Banana Peppers', image: '', price: 0 },
  { name: 'Jalapeño Peppers', image: '', price: 0 },
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

const isVeggiePizza = (p) => p.id === 'veggie-pizza' || (p.name || '').toLowerCase().includes('veggie');

const VegeterianPizzaCustomizer = ({ pizza, onClose }) => {
  const { addToCart } = useCart();
  const isVeggie = isVeggiePizza(pizza);
  const [selectedCrust, setSelectedCrust] = useState(CRUSTS[0]);
  const [selectedCheeses, setSelectedCheeses] = useState([]);
  const [selectedVeggies, setSelectedVeggies] = useState(isVeggie ? [...VEGGIES] : []);
  const [selectedExtraVeggies, setSelectedExtraVeggies] = useState([]);

  const toggleMulti = (item, selectedList, setter) => {
    setter((prev) => {
      const exists = prev.find((t) => t.name === item.name);
      if (exists) return prev.filter((t) => t.name !== item.name);
      return [...prev, item];
    });
  };

  const calculatePrice = () => {
    const base = pizza.basePrice ?? 0;
    const cheeses = selectedCheeses.reduce((s, t) => s + (t.price ?? 0), 0);
    const veggies = selectedVeggies.reduce((s, t) => s + (t.price ?? 0), 0);
    const extraVeggies = selectedExtraVeggies.reduce((s, t) => s + (t.price ?? 0), 0);
    return base + cheeses + veggies + extraVeggies;
  };

  const handleAddToCart = () => {
    const customizations = {
      crust: selectedCrust,
      cheeses: selectedCheeses,
      veggies: selectedVeggies,
      extraVeggies: selectedExtraVeggies,
    };
    addToCart({
      id: `vegeterian-${pizza.id}-${Date.now()}`,
      name: pizza.name,
      price: calculatePrice(),
      image: pizza.image,
      customizations,
    });
    onClose();
  };

  return (
    <div className="customizer-overlay" onClick={onClose}>
      <div className="customizer-modal build-your-own-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="customizer-content byo-content-no-header">
          <div className="byo-section">
            <h3 className="byo-section-label">Choose crust</h3>
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

          {isVeggie && (
            <div className="byo-section">
              <h3 className="byo-section-label">Veggies</h3>
              <div className="byo-options-row">
                {VEGGIES.map((t) => {
                  const isSelected = selectedVeggies.some((x) => x.name === t.name);
                  return (
                    <OptionCard
                      key={t.name}
                      item={t}
                      imageSrc={getToppingImageForItem(t)}
                      isSelected={isSelected}
                      onSelect={() => toggleMulti(t, selectedVeggies, setSelectedVeggies)}
                    />
                  );
                })}
              </div>
            </div>
          )}
          <div className="byo-section">
            <h3 className="byo-section-label">{isVeggie ? 'Extra veggies' : 'Extra toppings'}</h3>
            <div className="byo-options-row">
              {VEGGIES.map((t) => {
                const isSelected = selectedExtraVeggies.some((x) => x.name === t.name);
                return (
                  <OptionCard
                    key={t.name}
                    item={t}
                    imageSrc={getToppingImageForItem(t)}
                    isSelected={isSelected}
                    onSelect={() => toggleMulti(t, selectedExtraVeggies, setSelectedExtraVeggies)}
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
              <button type="button" className="added-item-tag" onClick={() => setSelectedCrust(CRUSTS[0])} title="Reset to default">
                {selectedCrust.name} <span className="added-item-remove">×</span>
              </button>
            )}
            {selectedCheeses.map((c) => (
              <button key={c.name} type="button" className="added-item-tag" onClick={() => setSelectedCheeses((prev) => prev.filter((t) => t.name !== c.name))} title="Remove">
                {c.name} <span className="added-item-remove">×</span>
              </button>
            ))}
            {selectedVeggies.map((t) => (
              <button key={t.name} type="button" className="added-item-tag" onClick={() => toggleMulti(t, selectedVeggies, setSelectedVeggies)} title="Remove">
                {t.name} <span className="added-item-remove">×</span>
              </button>
            ))}
            {selectedExtraVeggies.map((t) => (
              <button key={t.name} type="button" className="added-item-tag" onClick={() => setSelectedExtraVeggies((prev) => prev.filter((x) => x.name !== t.name))} title="Remove">
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

export default VegeterianPizzaCustomizer;
