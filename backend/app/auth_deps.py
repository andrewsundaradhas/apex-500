"""JWT dependency for route handlers.

Two dependencies:
- `current_user` — soft auth. Decodes Bearer token when present; in development
  falls back to the demo user so the UI works without a login. In production
  (`APEX_ENV=production`) the fallback is disabled and an unauthenticated
  request gets 401.
- `require_user` — strict. 401 on any missing/invalid token, all environments.
"""
import os
from typing import Optional

from fastapi import Header, HTTPException
from jose import JWTError, jwt

from .db.database import cursor
from .routers.auth import ALGO, SECRET

DEMO_USER_EMAIL = "demo@apex500.dev"


def _is_production() -> bool:
    return os.environ.get("APEX_ENV", "development").lower() == "production"


def current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Bearer token → {id, email}; dev-only fallback to the demo user."""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, SECRET, algorithms=[ALGO])
            return {"id": payload["uid"], "email": payload["sub"]}
        except JWTError:
            raise HTTPException(401, "Invalid token")

    if _is_production():
        raise HTTPException(401, "Missing Authorization header")

    with cursor() as c:
        row = c.execute("SELECT id, email FROM users WHERE email = ?", (DEMO_USER_EMAIL,)).fetchone()
    if not row:
        raise HTTPException(401, "Missing Authorization header")
    return {"id": row["id"], "email": row["email"]}


def require_user(authorization: Optional[str] = Header(None)) -> dict:
    """Strict: rejects when no valid JWT."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing Authorization header")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGO])
        return {"id": payload["uid"], "email": payload["sub"]}
    except JWTError:
        raise HTTPException(401, "Invalid token")
