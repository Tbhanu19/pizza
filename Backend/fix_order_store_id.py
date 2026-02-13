"""Fix orders with incorrect store_id by matching location/store names."""
from app.database import SessionLocal
from app.models import Order, Store

def fix_order_store_ids():
    db = SessionLocal()
    try:
        
        orders = db.query(Order).all()
        print(f"Found {len(orders)} orders")
        
        for order in orders:
            if order.store_id is None:
                continue
                
            
            store = db.query(Store).filter(Store.id == order.store_id).first()
            
            if not store and order.location:
                
                location_data = order.location
                if isinstance(location_data, dict):
                    store_name = location_data.get("store_name") or location_data.get("name")
                    if store_name:
                       
                        def normalize_name(name):
                           
                            normalized = ' '.join(name.strip().upper().split())
                            normalized = normalized.replace(' - ', '-').replace(' -', '-').replace('- ', '-')
                            return normalized
                        
                        store_name_clean = normalize_name(store_name)
                        
                        all_stores = db.query(Store).all()
                        matching_store = None
                        for s in all_stores:
                            if s.name:
                                s_name_clean = normalize_name(s.name)
                                if s_name_clean == store_name_clean:
                                    matching_store = s
                                    break
                                
                                if store_name_clean in s_name_clean or s_name_clean in store_name_clean:
                                    matching_store = s
                                    break
                        
                        if matching_store:
                            print(f"Order {order.id}: Updating store_id from {order.store_id} to {matching_store.id} ({matching_store.name})")
                            order.store_id = matching_store.id
                            db.commit()
                        else:
                            print(f"Order {order.id}: No matching store found for '{store_name}' (searched: {store_name_clean})")
                            print(f"  Available stores: {[s.name for s in all_stores]}")
        
        print("Done fixing orders")
    finally:
        db.close()

if __name__ == "__main__":
    fix_order_store_ids()
