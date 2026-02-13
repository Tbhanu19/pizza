"""Database engine, session, and base."""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DATABASE_URL


connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and add any missing columns."""
    from . import models
    Base.metadata.create_all(bind=engine)
   
    if "sqlite" in DATABASE_URL:
        with engine.connect() as conn:
            
            r = conn.execute(text(
                "SELECT 1 FROM pragma_table_info('orders') WHERE name='location'"
            ))
            if r.scalar() is None:
                conn.execute(text("ALTER TABLE orders ADD COLUMN location TEXT"))
                conn.commit()
            
            
            r = conn.execute(text(
                "SELECT 1 FROM pragma_table_info('cart') WHERE name='user_id'"
            ))
            if r.scalar() is None:
                conn.execute(text("ALTER TABLE cart ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                conn.commit()
            
           
            r = conn.execute(text(
                "SELECT 1 FROM pragma_table_info('orders') WHERE name='user_id'"
            ))
            if r.scalar() is None:
                conn.execute(text("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                conn.commit()
            # Check and add store_id to orders
            r = conn.execute(text(
                "SELECT 1 FROM pragma_table_info('orders') WHERE name='store_id'"
            ))
            if r.scalar() is None:
                conn.execute(text("ALTER TABLE orders ADD COLUMN store_id INTEGER REFERENCES stores(id)"))
                conn.commit()
            
           
            r = conn.execute(text(
                "SELECT 1 FROM pragma_table_info('orders') WHERE name='status'"
            ))
            if r.scalar() is None:
                conn.execute(text("ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'PENDING'"))
                conn.commit()
            else:
                conn.execute(text("UPDATE orders SET status = UPPER(TRIM(status)) WHERE status IS NOT NULL"))
                conn.commit()

           
            r = conn.execute(text(
                "SELECT 1 FROM pragma_table_info('orders') WHERE name='accepted_at'"
            ))
            if r.scalar() is None:
                conn.execute(text("ALTER TABLE orders ADD COLUMN accepted_at DATETIME"))
                conn.commit()
            
            
            r = conn.execute(text(
                "SELECT 1 FROM pragma_table_info('orders') WHERE name='rejected_at'"
            ))
            if r.scalar() is None:
                conn.execute(text("ALTER TABLE orders ADD COLUMN rejected_at DATETIME"))
                conn.commit()
            
            
            r = conn.execute(text(
                "SELECT 1 FROM pragma_table_info('orders') WHERE name='updated_at'"
            ))
            if r.scalar() is None:
                conn.execute(text("ALTER TABLE orders ADD COLUMN updated_at DATETIME"))
                conn.commit()

            for col, spec in [
                ("payment_intent_id", "TEXT"),
                ("payment_status", "TEXT DEFAULT 'pending'"),
                ("payment_method", "TEXT"),
            ]:
                r = conn.execute(text(
                    f"SELECT 1 FROM pragma_table_info('orders') WHERE name='{col}'"
                ))
                if r.scalar() is None:
                    conn.execute(text(f"ALTER TABLE orders ADD COLUMN {col} {spec}"))
                    conn.commit()

           
            r = conn.execute(text(
                "SELECT 1 FROM pragma_table_info('admins') WHERE name='username'"
            ))
            if r.scalar() is None:
                conn.execute(text("ALTER TABLE admins ADD COLUMN username VARCHAR(100)"))
                conn.commit()

           
            r = conn.execute(text(
                "SELECT 1 FROM pragma_table_info('admins') WHERE name='is_first_login'"
            ))
            if r.scalar() is None:
                conn.execute(text("ALTER TABLE admins ADD COLUMN is_first_login BOOLEAN DEFAULT 1"))
                conn.commit()

          
            r = conn.execute(text(
                "SELECT 1 FROM pragma_table_info('locations') WHERE name='store_id'"
            ))
            if r.scalar() is None:
                conn.execute(text("ALTER TABLE locations ADD COLUMN store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL"))
                conn.commit()
                
                conn.execute(text("""
                    UPDATE locations SET store_id = (
                        SELECT id FROM stores 
                        WHERE UPPER(TRIM(REPLACE(REPLACE(REPLACE(stores.name, ' - ', '-'), ' -', '-'), '- ', '-'))) = 
                              UPPER(TRIM(REPLACE(REPLACE(REPLACE(locations.store_name, ' - ', '-'), ' -', '-'), '- ', '-')))
                        LIMIT 1
                    ) WHERE store_id IS NULL
                """))
                conn.commit()
