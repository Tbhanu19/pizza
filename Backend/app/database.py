<<<<<<< HEAD
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
    """Create all tables and add any missing columns (e.g. orders.location)."""
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
=======
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
    """Create all tables and add any missing columns (e.g. orders.location)."""
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
>>>>>>> 9ea165a1704de24445771a5c551b07ef0ba8c933
