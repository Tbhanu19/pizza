

import imgOriginalCrust from '../assets/toppings/original-crust.png';
import imgThinCrust from '../assets/toppings/thin-crust.png';
import imgTomatoSauce from '../assets/toppings/tomato-sauce.jpg';
import imgMozzarella from '../assets/toppings/mozzarella.jpg';
import imgCheddar from '../assets/toppings/cheddar.jpg';
import imgPepperoni from '../assets/toppings/pepperoni.jpg';
import imgItalianSausage from '../assets/toppings/italian-sausage.jpg';
import imgBeef from '../assets/toppings/beef.jpg';
import imgBacon from '../assets/toppings/bacon.jpg';
import imgBellPeppers from '../assets/toppings/bell-peppers.jpg';
import imgMushrooms from '../assets/toppings/mushrooms.jpg';
import imgOnions from '../assets/toppings/onions.jpg';
import imgBlackOlives from '../assets/toppings/black-olives.jpg';
import imgBananaPeppers from '../assets/toppings/banana-peppers.jpg';
import imgJalapenoPeppers from '../assets/toppings/jalapeno-peppers.jpg';

const TOPPING_IMAGES = {
  'Original Crust': imgOriginalCrust,
  'Thin Crust': imgThinCrust,
  'Tomato Sauce': imgTomatoSauce,
  'Mozzarella': imgMozzarella,
  'Cheddar': imgCheddar,
  'Pepperoni': imgPepperoni,
  'Italian Sausage': imgItalianSausage,
  'Beef': imgBeef,
  'Bacon': imgBacon,
  'Bell Peppers': imgBellPeppers,
  'Mushrooms': imgMushrooms,
  'Onions': imgOnions,
  'Black Olives': imgBlackOlives,
  'Banana Peppers': imgBananaPeppers,
  'Jalapeño Peppers': imgJalapenoPeppers,
  
  'Extra Mozzarella': imgMozzarella,
  'Extra Cheddar': imgCheddar,
  'Extra Cheese': imgMozzarella,
};

/**
 * Get image for an ingredient/option by name. Extras use same images as base ingredients.
 * @param {string} name - Option/ingredient name (e.g. "Pepperoni", "Extra Mozzarella")
 * @returns {string|null} - Image src or null
 */
export function getToppingImage(name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  if (TOPPING_IMAGES[trimmed]) return TOPPING_IMAGES[trimmed];
  return null;
}


export function getToppingImageForItem(item) {
  return item && getToppingImage(item.name);
}

export default getToppingImage;
