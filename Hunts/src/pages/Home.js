import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

import imgLotsaMeat from '../assets/specialty-lotsa-meat.png';
import imgLoaded from '../assets/specialty-loaded.png';
import imgBreakfast from '../assets/specialty-breakfast.png';

const POPULAR_PIZZAS = [
  { name: 'Lotsa Meat Pizza', image: imgLotsaMeat },
  { name: 'Loaded Pizza', image: imgLoaded },
  { name: 'Breakfast Pizza', image: imgBreakfast },
];

const Home = () => {
  const heroImage = `${process.env.PUBLIC_URL || ''}/hero-pizza.png`;

  return (
    <div className="home">
      <section className="hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="hero-content">
          <h1 className="hero-title">Delicious Pizza Delivered Fast</h1>
          <p className="hero-subtitle">Fresh ingredients, authentic flavors, delivered to your door</p>
          <Link to="/menu" className="cta-button">
            Order Now
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Hunt Brothers Pizza?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Fast Delivery</h3>
              <p>Get your pizza hot and fresh in 30 minutes or less</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🍕</div>
              <h3>Fresh Ingredients</h3>
              <p>We use only the finest, freshest ingredients in every pizza</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Customize Your Pizza</h3>
              <p>Build your perfect pizza with our wide selection of toppings</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Great Deals</h3>
              <p>Enjoy amazing deals and discounts on every order</p>
            </div>
          </div>
        </div>
      </section>

      <section className="popular-pizzas">
        <div className="container">
          <h2 className="section-title">Popular Pizzas</h2>
          <div className="pizza-preview-grid">
            {POPULAR_PIZZAS.map((pizza) => (
              <div key={pizza.name} className="pizza-preview">
                <div className="pizza-preview-image">
                  <img src={pizza.image} alt={pizza.name} />
                </div>
                <h3>{pizza.name}</h3>
              </div>
            ))}
          </div>
          <div className="view-menu">
            <Link to="/menu" className="secondary-button">
              View Full Menu
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

