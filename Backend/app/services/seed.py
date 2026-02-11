"""Seed database only if tables are empty."""
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import SessionLocal, init_db
from ..models import Category, Product, Topping, PizzaTopping, Location

CATEGORIES = [
    "Build Your Own",
    "Specialty",
    "Vegetarian",
    "Chicken",
    "Drinks",
]

TOPPINGS_DATA = [
    ("Original Crust", "crust"),
    ("Thin Crust", "crust"),
    ("Tomato Sauce", "sauce"),
    ("Mozzarella", "cheese"),
    ("Cheddar", "cheese"),
    ("Pepperoni", "meat"),
    ("Italian Sausage", "meat"),
    ("Beef", "meat"),
    ("Bacon", "meat"),
    ("Bell Peppers", "veggie"),
    ("Mushrooms", "veggie"),
    ("Onions", "veggie"),
    ("Black Olives", "veggie"),
    ("Banana Peppers", "veggie"),
    ("Jalapeño Peppers", "veggie"),
]

LOTSA_DESC = (
    "A pizza that lives up to its name, our specialty Lotsa Meat Pizza is topped with "
    "mouth-watering Italian sausage, savory beef, tender bacon, and zesty pepperoni."
)
LOADED_DESC = (
    "You won't make it to the car without a bite. Our Loaded Pizza is topped generously with "
    "Italian sausage, delicious pepperoni, chunks of bacon, savory beef, bell peppers, mushrooms, "
    "onions, black olives, banana peppers and jalapeños for added kick."
)
BREAKFAST_DESC = (
    "Pizza for breakfast is good, but our specialty Breakfast Pizza baked fresh is better. "
    "Topped with fluffy scrambled eggs, chopped bacon, breakfast sausage, and of course a blend "
    "of mozzarella and cheddar, it's all there on our buttered original crust for an excellent "
    "breakfast any time, day or night."
)


def _count(db: Session, model):
    return db.query(func.count(model.id)).scalar() or 0


def seed_if_empty(db: Session) -> None:
    if _count(db, Category) > 0:
        return

    
    cat_by_name = {}
    for name in CATEGORIES:
        c = Category(name=name)
        db.add(c)
        db.flush()
        cat_by_name[name] = c.id

   
    topping_by_name = {}
    for name, ttype in TOPPINGS_DATA:
        t = Topping(name=name, type=ttype)
        db.add(t)
        db.flush()
        topping_by_name[name] = t.id

    
    byo = Product(
        name="Build Your Own",
        description="Choose your crust, sauce, cheese, and toppings to create your perfect pizza",
        size=None,
        sauce=None,
        image="🍕",
        category_id=cat_by_name["Build Your Own"],
        type="pizza",
        base_price=0.0,
    )
    db.add(byo)
    db.flush()

    
    lotsa = Product(
        name="Lotsa Meat Pizza",
        description=LOTSA_DESC,
        size='12" Medium',
        sauce="Tomato Sauce",
        image="🍕",
        category_id=cat_by_name["Specialty"],
        type="pizza",
        base_price=0.0,
    )
    db.add(lotsa)
    db.flush()

    loaded = Product(
        name="Loaded",
        description=LOADED_DESC,
        size='12" Medium',
        sauce="Tomato Sauce",
        image="🍕",
        category_id=cat_by_name["Specialty"],
        type="pizza",
        base_price=0.0,
    )
    db.add(loaded)
    db.flush()

    breakfast = Product(
        name="Breakfast",
        description=BREAKFAST_DESC,
        size=None,
        sauce=None,
        image="🍕",
        category_id=cat_by_name["Specialty"],
        type="pizza",
        base_price=0.0,
    )
    db.add(breakfast)
    db.flush()

  
    cheese_pizza = Product(
        name="Cheese Pizza",
        description="Meat-free options only. Choose crust, add more cheese, extra veggie toppings.",
        size=None,
        sauce=None,
        image="🍕",
        category_id=cat_by_name["Vegetarian"],
        type="pizza",
        base_price=0.0,
    )
    db.add(cheese_pizza)
    db.flush()

    veggie_pizza = Product(
        name="Veggie Pizza",
        description="Meat-free options only. Choose crust, add more cheese, extra veggie toppings.",
        size=None,
        sauce=None,
        image="🍕",
        category_id=cat_by_name["Vegetarian"],
        type="pizza",
        base_price=0.0,
    )
    db.add(veggie_pizza)
    db.flush()

   
    chicken_items = [
        ("Southern Style Wings", "🍗"),
        ("Hot n Spicy Wings", "🍗"),
        ("Homestyle WingBites", "🍗"),
        ("Buffalo WingBites", "🍗"),
    ]
    for name, img in chicken_items:
        p = Product(
            name=name,
            description=None,
            size=None,
            sauce=None,
            image=img,
            category_id=cat_by_name["Chicken"],
            type="chicken",
            base_price=0.0,
        )
        db.add(p)
    db.flush()

   
    drinks = [
        ("Coke", "Classic 20oz bottle", "🥤"),
        ("Pepsi", "Classic 20oz bottle", "🥤"),
        ("Sprite", "Lemon-lime 20oz bottle", "🥤"),
        ("Water", "Bottled water 20oz", "🥤"),
    ]
    for name, desc, img in drinks:
        p = Product(
            name=name,
            description=desc,
            size=None,
            sauce=None,
            image=img,
            category_id=cat_by_name["Drinks"],
            type="drink",
            base_price=0.0,
        )
        db.add(p)
    db.flush()

  
    for topping_name in ("Pepperoni", "Italian Sausage", "Beef", "Bacon"):
        db.add(PizzaTopping(product_id=lotsa.id, topping_id=topping_by_name[topping_name]))

   
    for topping_name in ("Pepperoni", "Italian Sausage", "Beef", "Bacon"):
        db.add(PizzaTopping(product_id=loaded.id, topping_id=topping_by_name[topping_name]))
    for topping_name in ("Bell Peppers", "Mushrooms", "Onions", "Black Olives", "Banana Peppers", "Jalapeño Peppers"):
        db.add(PizzaTopping(product_id=loaded.id, topping_id=topping_by_name[topping_name]))

    db.commit()


SAMPLE_LOCATIONS = [
    {
        "store_name": "JEREMY'S GROCERY",
        "address": "3444 EAST ILLINOIS AVE",
        "area": "East Illinois",
        "city": "DALLAS",
        "state": "TX",
        "pincode": "75216",
        "phone": "(214) 374-5357",
        "opening_time": "09:00",
        "closing_time": "21:00",
    },
    {
        "store_name": "CASH SAVER - CAMP WISDOM",
        "address": "1201 WEST CAMP WISDOM RD",
        "area": "Camp Wisdom",
        "city": "DALLAS",
        "state": "TX",
        "pincode": "75232",
        "phone": "(214) 376-2347",
        "opening_time": "09:00",
        "closing_time": "21:00",
    },
    {
        "store_name": "CIRCLE M STORE 1",
        "address": "3401 SAIN FRANCIS AVENUE",
        "area": None,
        "city": "DALLAS",
        "state": "TX",
        "pincode": "75228",
        "phone": "(469) 677-0771",
        "opening_time": "09:00",
        "closing_time": "21:00",
    },
    {
        "store_name": "HAPPY MART",
        "address": "4302 WEST CAMP WISDOM RD",
        "area": "West Camp Wisdom",
        "city": "DALLAS",
        "state": "TX",
        "pincode": "75237",
        "phone": "(214) 918-9942",
        "opening_time": "09:00",
        "closing_time": "21:00",
    },
    {
        "store_name": "CASH SAVER - LEDBETTER",
        "address": "2130 EAST LEDBETTER DR",
        "area": "Ledbetter",
        "city": "DALLAS",
        "state": "TX",
        "pincode": "75216",
        "phone": "(214) 374-3237",
        "opening_time": "09:00",
        "closing_time": "21:00",
    },
    {
        "store_name": "EAT ZONE",
        "address": "3003 E ILLINOIS AVE STE 1",
        "area": "East Illinois",
        "city": "DALLAS",
        "state": "TX",
        "pincode": "75216",
        "phone": "(214) 376-9663",
        "opening_time": "09:00",
        "closing_time": "21:00",
    },
    {
        "store_name": "EXPRESS MART MOBIL",
        "address": "4010 SOUTH WALTON WALKER BOULEVARD",
        "area": "South Walton Walker",
        "city": "DALLAS",
        "state": "TX",
        "pincode": "75236",
        "phone": "(214) 484-1318",
        "opening_time": "09:00",
        "closing_time": "21:00",
    },
    {
        "store_name": "EAGLE EXPRESS",
        "address": "8661 SOUTH HAMPTON ROAD",
        "area": "South Hampton",
        "city": "DALLAS",
        "state": "TX",
        "pincode": "75232",
        "phone": "(806) 282-2901",
        "opening_time": "09:00",
        "closing_time": "21:00",
    },
]


def seed_locations_if_empty(db: Session) -> None:
    if _count(db, Location) > 0:
        return
    for data in SAMPLE_LOCATIONS:
        db.add(Location(**data))
    db.commit()


def run_seed():
    init_db()
    db = SessionLocal()
    try:
        seed_if_empty(db)
        seed_locations_if_empty(db)
    finally:
        db.close()
