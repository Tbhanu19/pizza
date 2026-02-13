"""Fix locations.store_id to properly link to stores.id by matching store names."""
from app.database import SessionLocal
from app.models import Location, Store


def normalize_store_name(name: str) -> str:
    """Normalize store name for matching: remove extra spaces, normalize dash spacing, uppercase."""
    if not name:
        return ""
    normalized = ' '.join(name.strip().upper().split())
    normalized = normalized.replace(' - ', '-').replace(' -', '-').replace('- ', '-')
    return normalized


def fix_locations_store_ids():
    """Link locations to stores by matching normalized store names."""
    db = SessionLocal()
    try:
        locations = db.query(Location).all()
        stores = db.query(Store).all()
        
        print(f"Found {len(locations)} locations and {len(stores)} stores")
        
        linked_count = 0
        updated_count = 0
        
        for location in locations:
            if not location.store_name:
                continue
            
           
            loc_name_clean = normalize_store_name(location.store_name)
            
            
            if location.store_id:
                store = db.query(Store).filter(Store.id == location.store_id).first()
                if store:
                    store_name_clean = normalize_store_name(store.name)
                    if loc_name_clean == store_name_clean:
                        
                        continue
                    else:
                       
                        print(f"Location {location.id} ({location.store_name}) has incorrect store_id={location.store_id} (store name: {store.name})")
            
           
            matching_store = None
            for store in stores:
                if not store.name:
                    continue
                store_name_clean = normalize_store_name(store.name)
                
               
                if loc_name_clean == store_name_clean:
                    matching_store = store
                    break
                
               
                if loc_name_clean in store_name_clean or store_name_clean in loc_name_clean:
                    matching_store = store
                    break
            
            if matching_store:
                if location.store_id != matching_store.id:
                    print(f"Linking Location {location.id} ({location.store_name}) -> Store {matching_store.id} ({matching_store.name})")
                    location.store_id = matching_store.id
                    updated_count += 1
                else:
                    linked_count += 1
            else:
                print(f"Location {location.id} ({location.store_name}): No matching store found")
                print(f"  Normalized: {loc_name_clean}")
                print(f"  Available stores: {[s.name for s in stores]}")
        
        if updated_count > 0:
            db.commit()
            print(f"\n[SUCCESS] Updated {updated_count} locations")
        else:
            print(f"\n[INFO] All locations are already correctly linked ({linked_count} verified)")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to fix locations: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    fix_locations_store_ids()
