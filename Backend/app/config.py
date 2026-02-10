<<<<<<< HEAD
"""Application configuration."""
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pizza.db")
if "sqlite+aiosqlite" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")

SESSION_HEADER = "X-Session-Id"

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-use-openssl-rand-hex-32")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
=======
"""Application configuration."""
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pizza.db")
if "sqlite+aiosqlite" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")

SESSION_HEADER = "X-Session-Id"

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-use-openssl-rand-hex-32")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
>>>>>>> 9ea165a1704de24445771a5c551b07ef0ba8c933
