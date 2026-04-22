"""Auth endpoints — JWT-based. Intentionally simple; demo-grade."""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, HTTPException
from jose import jwt
from pydantic import BaseModel

from ..db.database import cursor

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET = os.environ.get("APEX_JWT_SECRET", "apex-dev-secret-replace-in-prod")
ALGO = "HS256"
TTL_MINUTES = int(os.environ.get("APEX_JWT_TTL_MIN", "1440"))


class LoginIn(BaseModel):
    email: str
    password: str


class SignupIn(BaseModel):
    email: str
    password: str
    name: str | None = None


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode()[:72], bcrypt.gensalt(rounds=6)).decode()


def _verify(password: str, stored: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode()[:72], stored.encode())
    except Exception:
        return False


def _token(email: str, user_id: int) -> str:
    payload = {
        "sub": email,
        "uid": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=TTL_MINUTES),
    }
    return jwt.encode(payload, SECRET, algorithm=ALGO)


@router.post("/login")
def login(payload: LoginIn):
    with cursor() as c:
        row = c.execute("SELECT * FROM users WHERE email = ?", (payload.email,)).fetchone()
    if row is None or not _verify(payload.password, row["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    return {
        "token": _token(row["email"], row["id"]),
        "user": {"email": row["email"], "name": row["name"], "firm": row["firm"]},
    }


@router.post("/signup")
def signup(payload: SignupIn):
    with cursor() as c:
        existing = c.execute("SELECT id FROM users WHERE email = ?", (payload.email,)).fetchone()
        if existing:
            raise HTTPException(400, "Email already registered")
        pw = _hash(payload.password)
        c.execute("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
                  (payload.email, pw, payload.name))
        uid = c.lastrowid
        for t in ["SPX", "AAPL", "NVDA"]:
            c.execute("INSERT OR IGNORE INTO watchlist (user_id, ticker) VALUES (?, ?)", (uid, t))

    return {
        "token": _token(payload.email, uid),
        "user": {"email": payload.email, "name": payload.name, "firm": None},
    }
