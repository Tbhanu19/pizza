"""Admin authentication service using bcrypt. JWT creation in auth module."""
import secrets
import string
import bcrypt
from sqlalchemy.orm import Session

from ..models import Admin, Store, Location


def generate_secure_password(length: int = 12) -> str:
    """Generate a secure random password (alphanumeric + symbols)."""
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def hash_password(password: str) -> str:
    """Hash password using bcrypt directly (same as auth_service)."""
    raw = password.encode("utf-8")[:72]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify password using bcrypt directly (same as auth_service)."""
    raw = plain.encode("utf-8")[:72]
    return bcrypt.checkpw(raw, hashed.encode("utf-8"))


def get_admin_by_email(db: Session, email: str) -> Admin | None:
    """Get admin by email."""
    return db.query(Admin).filter(Admin.email == email).first()


def get_admin_by_username(db: Session, username: str) -> Admin | None:
    """Get admin by username."""
    return db.query(Admin).filter(Admin.username == username).first()


def get_admin_by_username_or_email(db: Session, username_or_email: str) -> Admin | None:
    """Get admin by username or email."""
    admin = db.query(Admin).filter(Admin.username == username_or_email).first()
    if admin:
        return admin
    return db.query(Admin).filter(Admin.email == username_or_email).first()


def get_admin_by_store_id(db: Session, store_id: int) -> Admin | None:
    """Get the store's admin (username = store_<store_id>). One admin per store."""
    username = f"store_{store_id}"
    return db.query(Admin).filter(Admin.store_id == store_id, Admin.username == username).first()


def create_admin(
    db: Session,
    name: str,
    email: str | None,
    password: str,
    store_id: int | None = None,
    phone: str | None = None,
    role: str = "STORE_ADMIN",
    username: str | None = None,
    is_first_login: bool = False,
) -> Admin:
    """Create a new admin user."""
    password_hash = hash_password(password)
    admin = Admin(
        username=username,
        name=name,
        email=email or None,
        password_hash=password_hash,
        store_id=store_id,
        phone=phone,
        role=role,
        is_first_login=is_first_login,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def create_store_admin_auto(
    db: Session, store_id: int, store_name: str
) -> tuple[Admin, str]:
    """
    Create admin for a store: username=store_<store_id>, random password.
    Returns (admin, plain_password).
    """
    username = f"store_{store_id}"
    if get_admin_by_username(db, username):
        raise ValueError(f"Admin for store {store_id} already exists")
    plain_password = generate_secure_password(12)
    password_hash = hash_password(plain_password)
    admin = Admin(
        username=username,
        email=None,
        name=None,
        password_hash=password_hash,
        store_id=store_id,
        role="STORE_ADMIN",
        is_active=True,
        is_first_login=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin, plain_password


def ensure_store_exists(db: Session, admin: Admin) -> Store | None:
    """
    Ensure admin's store exists in stores table. If admin.store_id is set but store doesn't exist,
    try to create it from location data or create a minimal store.
    Returns Store if exists/created, None if admin has no store_id.
    Updates admin.store_id if a new store is created with a different ID.
    """
    if admin.store_id is None:
        return None
    
   
    store = db.query(Store).filter(Store.id == admin.store_id).first()
    if store:
        return store
    
    
    location = None
    if admin.store_id:
        
        location = db.query(Location).filter(Location.store_id == admin.store_id).first()
    
   
    if location:
        store = Store(
            name=location.store_name,
            address=location.address or None,
            city=location.city or None,
            state=location.state or None,
            pincode=location.pincode or None,
            phone=location.phone or None,
            is_active=True,
        )
    else:
        
        store = Store(
            name=f"Store {admin.store_id}",
            address=None,
            city=None,
            state=None,
            pincode=None,
            phone=admin.phone,
            is_active=True,
        )
    
    db.add(store)
    db.commit()
    db.refresh(store)
    
   
    if store.id != admin.store_id:
        admin.store_id = store.id
        db.commit()
    
    return store


def normalize_store_name(name: str) -> str:
    """Normalize store name for matching: remove extra spaces, normalize dash spacing, uppercase."""
    if not name:
        return ""
    normalized = ' '.join(name.strip().upper().split())
    normalized = normalized.replace(' - ', '-').replace(' -', '-').replace('- ', '-')
    return normalized


def link_locations_to_store(db: Session, store: Store) -> None:
    """Link locations to a store by matching normalized store names. Updates locations even if already linked."""
    if not store.name:
        return
    
    store_name_clean = normalize_store_name(store.name)
   
    locations = db.query(Location).all()
    
    for location in locations:
        if not location.store_name:
            continue
        
        loc_name_clean = normalize_store_name(location.store_name)
        
       
        is_match = (
            loc_name_clean == store_name_clean or 
            loc_name_clean in store_name_clean or 
            store_name_clean in loc_name_clean
        )
        
        if is_match:
           
            location.store_id = store.id


def create_store(
    db: Session,
    store_name: str,
    address: str | None = None,
    city: str | None = None,
    state: str | None = None,
    pincode: str | None = None,
    phone: str | None = None,
) -> Store:
    """
    Create a new store with provided details. Store ID is auto-generated.
    Always creates a new store (no searching for existing stores).
    """
    store = Store(
        name=store_name,
        address=address,
        city=city,
        state=state,
        pincode=pincode,
        phone=phone,
        is_active=True,
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    
    
    link_locations_to_store(db, store)
    db.commit()
    
    return store


def create_access_token(admin_id: int, store_id: int) -> str:
    """Create admin JWT (admin_id, store_id, role=admin). Use auth.create_admin_access_token."""
    from ..auth import create_admin_access_token
    return create_admin_access_token(admin_id, store_id)
