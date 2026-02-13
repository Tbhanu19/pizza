"""Fix order store_id based on location data - match location.store_name to Store.name."""
from app.database import SessionLocal
from app.models import Order, Store, Location


def normalize_store_name(name: str) -> str:
    """Normalize store name for matching."""
    if not name:
        return ""
    normalized = ' '.join(name.strip().upper().split())
    normalized = normalized.replace(' - ', '-').replace(' -', '-').replace('- ', '-')
    return normalized


def fix_orders_from_locations():
    """Fix order store_id by matching order.location.store_name to Store.name."""
    db = SessionLocal()
    try:
        orders = db.query(Order).all()
        stores = db.query(Store).all()
        
        print(f"Found {len(orders)} orders and {len(stores)} stores")
        
        fixed_count = 0
        
        for order in orders:
            if not order.location or not isinstance(order.location, dict):
                continue
            
            store_name = order.location.get("store_name") or order.location.get("name")
            if not store_name:
                continue
            
           
            location = db.query(Location).filter(Location.store_name == store_name).first()
            if location and location.store_id:
               
                if order.store_id != location.store_id:
                    print(f"Order {order.id}: Updating store_id from {order.store_id} to {location.store_id} (from location {location.id})")
                    order.store_id = location.store_id
                    fixed_count += 1
                continue
            
           
            store_name_clean = normalize_store_name(store_name)
            matching_store = None
            
            for store in stores:
                if not store.name:
                    continue
                store_name_normalized = normalize_store_name(store.name)
                
                if store_name_clean == store_name_normalized:
                    matching_store = store
                    break
                
                if store_name_clean in store_name_normalized or store_name_normalized in store_name_clean:
                    matching_store = store
                    break
            
            if matching_store and order.store_id != matching_store.id:
                print(f"Order {order.id}: Updating store_id from {order.store_id} to {matching_store.id} ({matching_store.name})")
                order.store_id = matching_store.id
                fixed_count += 1
        
        if fixed_count > 0:
            db.commit()
            print(f"\n[SUCCESS] Fixed {fixed_count} orders")
        else:
            print(f"\n[INFO] All orders are already correctly linked")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to fix orders: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    fix_orders_from_locations()
