from .menu import router as menu_router
from .auth import router as auth_router
from .cart import router as cart_router
from .orders import router as orders_router
from .locations import router as locations_router
from .admin import router as admin_router
from .payments import router as payments_router

__all__ = ["menu_router", "auth_router", "cart_router", "orders_router", "locations_router", "admin_router", "payments_router"]
