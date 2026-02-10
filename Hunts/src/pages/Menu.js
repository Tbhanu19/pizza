import React, { useState, useEffect } from 'react';
import { api } from '../api';
import PizzaCard from '../components/PizzaCard';
import PizzaCustomizer from '../components/PizzaCustomizer';
import BuildYourOwnCustomizer from '../components/BuildYourOwnCustomizer';
import SpecialityItemsView from '../components/SpecialityItemsView';
import ChickenItemsView from '../components/ChickenItemsView';
import DrinksItemsView from '../components/DrinksItemsView';
import VegeterianItemsView from '../components/VegeterianItemsView';
import buildYourOwnImage from '../assets/build-your-own.png';
import './Menu.css';

const CATEGORY_DISPLAY = {
  'Build Your Own': { name: 'Build your own', description: 'Choose your crust, sauce, cheese, and toppings to create your perfect pizza', image: '🍕' },
  'Specialty': { name: 'Speciality', description: "Our chef's special pizzas with unique combinations", image: '🍕' },
  'Vegetarian': { name: 'Vegeterian', description: 'Fresh vegetables and delicious meat-free options', image: '🍕' },
  'Chicken': { name: 'Chicken', description: 'Tender chicken toppings and flavours', image: '🍕' },
  'Drinks': { name: 'Drinks', description: 'Refreshing sodas, teas, and more', image: '🥤' },
};

const Menu = () => {
  const [menuOptions, setMenuOptions] = useState([]);
  const [loading, setLoading] = useState(!!api.isConfigured());
  const [menuError, setMenuError] = useState(null);
  const [selectedPizza, setSelectedPizza] = useState(null);

  useEffect(() => {
    if (!api.isConfigured()) {
      setMenuOptions([
        { id: 1, name: 'Build your own', description: CATEGORY_DISPLAY['Build Your Own'].description, basePrice: 0, image: '🍕' },
        { id: 2, name: 'Speciality', description: CATEGORY_DISPLAY['Specialty'].description, basePrice: 0, image: '🍕' },
        { id: 3, name: 'Vegeterian', description: CATEGORY_DISPLAY['Vegetarian'].description, basePrice: 0, image: '🍕' },
        { id: 4, name: 'Chicken', description: CATEGORY_DISPLAY['Chicken'].description, basePrice: 0, image: '🍕' },
        { id: 5, name: 'Drinks', description: CATEGORY_DISPLAY['Drinks'].description, basePrice: 0, image: '🥤' },
      ]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const categories = await api.getCategories();
        const options = (categories || []).map((c) => {
          const d = CATEGORY_DISPLAY[c.name] || { name: c.name, description: '', image: '🍕' };
          return {
            id: c.id,
            name: d.name,
            description: d.description,
            basePrice: 0,
            image: d.image,
          };
        });
        if (!cancelled) setMenuOptions(options);
      } catch (e) {
        if (!cancelled) {
          setMenuError(e.message || 'Failed to load menu');
          setMenuOptions([
            { id: 1, name: 'Build your own', description: CATEGORY_DISPLAY['Build Your Own'].description, basePrice: 0, image: '🍕' },
            { id: 2, name: 'Speciality', description: CATEGORY_DISPLAY['Specialty'].description, basePrice: 0, image: '🍕' },
            { id: 3, name: 'Vegeterian', description: CATEGORY_DISPLAY['Vegetarian'].description, basePrice: 0, image: '🍕' },
            { id: 4, name: 'Chicken', description: CATEGORY_DISPLAY['Chicken'].description, basePrice: 0, image: '🍕' },
            { id: 5, name: 'Drinks', description: CATEGORY_DISPLAY['Drinks'].description, basePrice: 0, image: '🥤' },
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handlePizzaSelect = (pizza) => {
    setSelectedPizza(pizza);
  };

  const handleCloseCustomizer = () => {
    setSelectedPizza(null);
  };

  if (loading) {
    return (
      <div className="menu-page">
        <div className="menu-loading">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      {menuError && <div className="menu-error">{menuError}</div>}
      <div className="menu-cards-grid">
        {menuOptions.map((item) => (
          <PizzaCard
            key={item.id}
            pizza={item.name === 'Build your own' ? { ...item, image: buildYourOwnImage } : item}
            onSelect={handlePizzaSelect}
          />
        ))}
      </div>

      {selectedPizza && selectedPizza.name === 'Build your own' && (
        <BuildYourOwnCustomizer
          pizza={selectedPizza}
          onClose={handleCloseCustomizer}
        />
      )}
      {selectedPizza && selectedPizza.name === 'Speciality' && (
        <SpecialityItemsView onClose={handleCloseCustomizer} />
      )}
      {selectedPizza && selectedPizza.name === 'Chicken' && (
        <ChickenItemsView onClose={handleCloseCustomizer} />
      )}
      {selectedPizza && selectedPizza.name === 'Drinks' && (
        <DrinksItemsView onClose={handleCloseCustomizer} />
      )}
      {selectedPizza && selectedPizza.name === 'Vegeterian' && (
        <VegeterianItemsView onClose={handleCloseCustomizer} />
      )}
      {selectedPizza && selectedPizza.name !== 'Build your own' && selectedPizza.name !== 'Speciality' && selectedPizza.name !== 'Chicken' && selectedPizza.name !== 'Drinks' && selectedPizza.name !== 'Vegeterian' && (
        <PizzaCustomizer
          pizza={selectedPizza}
          onClose={handleCloseCustomizer}
        />
      )}
    </div>
  );
};

export default Menu;
