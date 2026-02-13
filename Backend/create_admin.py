"""Script to create an admin user and optionally a store."""
import sys
from app.database import SessionLocal, init_db
from app.models import Store, Admin
from app.services.admin_service import hash_password, get_admin_by_email

def create_admin_account():
    """Interactive script to create admin account."""
    init_db()
    db = SessionLocal()
    
    try:
        print("=== Create Admin Account ===\n")
        
        
        stores = db.query(Store).all()
        if not stores:
            print("No stores found. Creating a default store...")
            create_store = input("Create a store? (y/n): ").lower().strip()
            if create_store == 'y':
                store_name = input("Store name: ").strip()
                store_address = input("Store address (optional): ").strip() or None
                store_city = input("Store city (optional): ").strip() or None
                store_state = input("Store state (optional): ").strip() or None
                store_phone = input("Store phone (optional): ").strip() or None
                
                store = Store(
                    name=store_name,
                    address=store_address,
                    city=store_city,
                    state=store_state,
                    phone=store_phone,
                )
                db.add(store)
                db.commit()
                db.refresh(store)
                print(f"✓ Store created with ID: {store.id}\n")
                store_id = store.id
            else:
                store_id = None
        else:
            print("Available stores:")
            for store in stores:
                print(f"  [{store.id}] {store.name} - {store.city or 'N/A'}")
            store_input = input("\nEnter store ID (or press Enter to skip): ").strip()
            store_id = int(store_input) if store_input else None
        
        
        print("\n--- Admin Details ---")
        name = input("Admin name: ").strip()
        email = input("Admin email: ").strip()
        password = input("Admin password: ").strip()
        phone = input("Admin phone (optional): ").strip() or None
        
        
        if get_admin_by_email(db, email):
            print(f"\n✗ Admin with email {email} already exists!")
            return
        
        
        password_hash = hash_password(password)
        admin = Admin(
            name=name,
            email=email,
            password_hash=password_hash,
            store_id=store_id,
            phone=phone,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print(f"\n✓ Admin created successfully!")
        print(f"  ID: {admin.id}")
        print(f"  Email: {admin.email}")
        print(f"  Store ID: {admin.store_id or 'Not assigned'}")
        print(f"\nYou can now login at: POST /admin/login")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_account()
