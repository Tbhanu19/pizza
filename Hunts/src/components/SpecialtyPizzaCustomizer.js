import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { getToppingImageForItem } from '../constants/toppingImages';
import './PizzaCustomizer.css';
import './BuildYourOwnCustomizer.css';

const CRUSTS = [
  { name: 'Original Crust', sublabel: null, image: '', price: 0 },
  { name: 'Thin Crust', sublabel: '12" Medium', image: '', price: 0 },
];

const SAUCES = [
  { name: 'Tomato Sauce', sublabel: null, image: '', price: 0 },
];

const MEATS = [
  { name: 'Pepperoni', image: '', price: 0 },
  { name: 'Italian Sausage', image: '', price: 0 },
  { name: 'Beef', image: '', price: 0 },
  { name: 'Bacon', image: '', price: 0 },
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

const EXTRA_TOPPINGS = [...MEATS, ...VEGGIES];
const isMeat = (name) => MEATS.some((m) => m.name === name);

const SpecialtyPizzaCustomizer = ({ pizza, onClose, showVeggies }) => {
  const { addToCart } = useCart();
  const isLotsaMeat = pizza.id === 'lotsa-meat' || (pizza.name || '').toLowerCase().includes('lotsa meat');
  const [selectedCrust, setSelectedCrust] = useState(CRUSTS[0]);
  const [selectedSauce, setSelectedSauce] = useState(SAUCES[0]);
  const [selectedMeats, setSelectedMeats] = useState(isLotsaMeat ? [...MEATS] : []);
  const [selectedExtraMeats, setSelectedExtraMeats] = useState([]);
  const [selectedVeggies, setSelectedVeggies] = useState([]);

  const toggleMulti = (item, selectedList, setter) => {
    setter((prev) => {
      const exists = prev.find((t) => t.name === item.name);
      if (exists) return prev.filter((t) => t.name !== item.name);
      return [...prev, item];
    });
  };

  const calculatePrice = () => {
    const base = pizza.basePrice;
    const meats = selectedMeats.reduce((s, t) => s + t.price, 0);
    const extraMeats = selectedExtraMeats.reduce((s, t) => s + t.price, 0);
    const veggies = selectedVeggies.reduce((s, t) => s + t.price, 0);
    return base + meats + extraMeats + veggies;
  };

  const handleAddToCart = () => {
    const extraToppingsWithPrice = [...selectedExtraMeats, ...(showVeggies ? selectedVeggies : [])].map((t) => ({ name: t.name, price: t.price ?? 0 }));
    const customizations = {
      crust: selectedCrust,
      sauce: selectedSauce,
      meats: selectedMeats,
      veggies: [],
      extraToppings: extraToppingsWithPrice,
    };
    addToCart({
      id: `specialty-${pizza.id}-${Date.now()}`,
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
            <h3 className="byo-section-label">Sauce</h3>
            <div className="byo-options-row">
              {SAUCES.map((s) => (
                <OptionCard
                  key={s.name}
                  item={s}
                  imageSrc={getToppingImageForItem(s)}
                  isSelected={selectedSauce?.name === s.name}
                  onSelect={() => setSelectedSauce(s)}
                  sublabel={s.sublabel}
                />
              ))}
            </div>
          </div>

          <div className="byo-section">
            <h3 className="byo-section-label">MEATS</h3>
            <div className="byo-options-row">
              {MEATS.map((m) => {
                const isSelected = selectedMeats.some((t) => t.name === m.name);
                return (
                  <OptionCard
                    key={m.name}
                    item={m}
                    imageSrc={getToppingImageForItem(m)}
                    isSelected={isSelected}
                    onSelect={() => toggleMulti(m, selectedMeats, setSelectedMeats)}
                  />
                );
              })}
            </div>
          </div>

          {showVeggies && (
            <div className="byo-section">
              <h3 className="byo-section-label">Extra toppings</h3>
              <div className="byo-options-row">
                {EXTRA_TOPPINGS.map((t) => {
                  const isSelected = isMeat(t.name)
                    ? selectedExtraMeats.some((x) => x.name === t.name)
                    : selectedVeggies.some((x) => x.name === t.name);
                  const onToggle = () =>
                    isMeat(t.name)
                      ? toggleMulti(t, selectedExtraMeats, setSelectedExtraMeats)
                      : toggleMulti(t, selectedVeggies, setSelectedVeggies);
                  return (
                    <OptionCard
                      key={t.name}
                      item={t}
                      imageSrc={getToppingImageForItem(t)}
                      isSelected={isSelected}
                      onSelect={onToggle}
                      showPrice
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="added-items-box">
          <h4 className="added-items-title">Added items</h4>
          <div className="added-items-list">
            {selectedCrust && (
              <button type="button" className="added-item-tag" onClick={() => setSelectedCrust(CRUSTS[0])} title="Reset to default">
                {selectedCrust.name} <span className="added-item-remove">×</span>
              </button>
            )}
            {selectedSauce && (
              <button type="button" className="added-item-tag" onClick={() => setSelectedSauce(SAUCES[0])} title="Reset to default">
                {selectedSauce.name} <span className="added-item-remove">×</span>
              </button>
            )}
            {selectedMeats.map((m) => (
              <button key={m.name} type="button" className="added-item-tag" onClick={() => setSelectedMeats((prev) => prev.filter((t) => t.name !== m.name))} title="Remove">
                {m.name} <span className="added-item-remove">×</span>
              </button>
            ))}
            {selectedExtraMeats.map((m) => (
              <button key={`extra-${m.name}`} type="button" className="added-item-tag" onClick={() => setSelectedExtraMeats((prev) => prev.filter((t) => t.name !== m.name))} title="Remove">
                {m.name} +${(m.price ?? 0).toFixed(2)} <span className="added-item-remove">×</span>
              </button>
            ))}
            {showVeggies && selectedVeggies.map((v) => (
              <button key={v.name} type="button" className="added-item-tag" onClick={() => setSelectedVeggies((prev) => prev.filter((t) => t.name !== v.name))} title="Remove">
                {v.name} +${(v.price ?? 0).toFixed(2)} <span className="added-item-remove">×</span>
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

export default SpecialtyPizzaCustomizer;
