"""Optional JWT dependency. Routes that want auth can use `Depends(require_user)`.

Kept optional — the dev UI should keep working without a token, but protected
endpoints can enforce one. If the frontend sends `Authorization: Bearer <jwt>`,
we decode it; otherwise we fall back to the demo user.
"""
from typing import Optional

from fastapi import Header, HTTPException
from jose import JWTError, jwt

from .db.database import cursor
from .routers.auth import ALGO, SECRET

DEMO_USER_EMAIL = "demo@apex500.dev"


def current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Returns {"id": int, "email": str} — demo user if no valid token present."""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, SECRET, algorithms=[ALGO])
            return {"id": payload["uid"], "email": payload["sub"]}
        except JWTError:
            pass
    # Fallback to demo user
    with cursor() as c:
        row = c.execute("SELECT id, email FROM users WHERE email = ?", (DEMO_USER_EMAIL,)).fetchone()
    if not row:
        raise HTTPException(500, "Demo user missing")
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
