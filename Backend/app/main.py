"""FastAPI app: CORS, lifespan for init DB + seed, routers."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db, SessionLocal
from .services import seed_if_empty, seed_locations_if_empty, seed_stores_from_locations
from .routers import menu_router, auth_router, cart_router, orders_router, locations_router, admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_if_empty(db)
        seed_locations_if_empty(db)
        seed_stores_from_locations(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Pizza API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(menu_router)
app.include_router(auth_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(locations_router)
app.include_router(admin_router)


@app.get("/")
def root():
    return {"message": "Pizza API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
