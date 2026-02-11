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

const TOPPINGS_LIST = [...MEATS, ...VEGGIES];
const isMeat = (name) => MEATS.some((m) => m.name === name);

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

const LoadedPizzaCustomizer = ({ pizza, onClose }) => {
  const { addToCart } = useCart();
  const [selectedCrust, setSelectedCrust] = useState(CRUSTS[0]);
  const [selectedSauce, setSelectedSauce] = useState(SAUCES[0]);
  const [selectedToppings, setSelectedToppings] = useState([...TOPPINGS_LIST]);
  const [extraQuantities, setExtraQuantities] = useState({});

  const toggleTopping = (item) => {
    setSelectedToppings((prev) => {
      const exists = prev.find((t) => t.name === item.name);
      if (exists) return prev.filter((t) => t.name !== item.name);
      return [...prev, item];
    });
  };

  const addExtra = (name) => {
    setExtraQuantities((prev) => ({ ...prev, [name]: (prev[name] || 0) + 1 }));
  };

  const removeExtra = (name) => {
    setExtraQuantities((prev) => {
      const n = (prev[name] || 0) - 1;
      if (n <= 0) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return { ...prev, [name]: n };
    });
  };

  const getExtraTotal = () => {
    return Object.entries(extraQuantities).reduce(
      (sum, [name, qty]) => sum + (TOPPINGS_LIST.find((t) => t.name === name)?.price ?? 0) * qty,
      0
    );
  };

  const calculatePrice = () => {
    const base = pizza.basePrice ?? 0;
    const toppingsTotal = selectedToppings.reduce((s, t) => s + (t.price ?? 0), 0);
    return base + toppingsTotal + getExtraTotal();
  };

  const buildCartCustomizations = () => {
    const baseMeats = selectedToppings.filter((t) => isMeat(t.name));
    const baseVeggies = selectedToppings.filter((t) => !isMeat(t.name));
    const extraToppingsList = [];
    Object.entries(extraQuantities).forEach(([name, qty]) => {
      const item = TOPPINGS_LIST.find((t) => t.name === name) || { name, price: 0 };
      for (let i = 0; i < qty; i++) {
        extraToppingsList.push({ name: item.name, price: item.price ?? 0 });
      }
    });
    return {
      crust: selectedCrust,
      sauce: selectedSauce,
      meats: baseMeats,
      veggies: baseVeggies,
      extraToppings: extraToppingsList,
    };
  };

  const handleAddToCart = () => {
    addToCart({
      id: `specialty-${pizza.id}-${Date.now()}`,
      name: pizza.name,
      price: calculatePrice(),
      image: pizza.image,
      customizations: buildCartCustomizations(),
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
            <h3 className="byo-section-label">Toppings</h3>
            <div className="byo-options-row">
              {TOPPINGS_LIST.map((t) => {
                const isSelected = selectedToppings.some((x) => x.name === t.name);
                return (
                  <OptionCard
                    key={t.name}
                    item={t}
                    imageSrc={getToppingImageForItem(t)}
                    isSelected={isSelected}
                    onSelect={() => toggleTopping(t)}
                  />
                );
              })}
            </div>
          </div>

          <div className="byo-section">
            <h3 className="byo-section-label">Extra Toppings</h3>
            <div className="byo-options-row">
              {TOPPINGS_LIST.map((t) => {
                const qty = extraQuantities[t.name] || 0;
                const isSelected = qty > 0;
                const onExtraSelect = () => (isSelected ? removeExtra(t.name) : addExtra(t.name));
                return (
                  <OptionCard
                    key={t.name}
                    item={t}
                    imageSrc={getToppingImageForItem(t)}
                    isSelected={isSelected}
                    onSelect={onExtraSelect}
                    sublabel={qty > 0 ? `×${qty}` : null}
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
            {selectedSauce && (
              <button type="button" className="added-item-tag" onClick={() => setSelectedSauce(SAUCES[0])} title="Reset">
                {selectedSauce.name} <span className="added-item-remove">×</span>
              </button>
            )}
            {selectedToppings.map((t) => (
              <button
                key={t.name}
                type="button"
                className="added-item-tag"
                onClick={() => toggleTopping(t)}
                title="Remove"
              >
                {t.name} <span className="added-item-remove">×</span>
              </button>
            ))}
            {Object.entries(extraQuantities).map(([name, qty]) => {
              if (qty <= 0) return null;
              const item = TOPPINGS_LIST.find((x) => x.name === name);
              const price = item?.price ?? 0;
              return (
                <button
                  key={`ex-${name}-${qty}`}
                  type="button"
                  className="added-item-tag"
                  onClick={() => removeExtra(name)}
                  title="Remove one"
                >
                  {name} +${price.toFixed(2)}{qty > 1 ? ` ×${qty}` : ''} <span className="added-item-remove">×</span>
                </button>
              );
            })}
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

export default LoadedPizzaCustomizer;
