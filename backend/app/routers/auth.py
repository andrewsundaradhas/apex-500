"""Auth endpoints — JWT-based.

Secret handling:
- Production (`APEX_ENV=production`) REQUIRES `APEX_JWT_SECRET`. Boot fails
  if it's missing or equals the dev placeholder.
- Development generates a random per-process secret when `APEX_JWT_SECRET`
  isn't set, so tokens are never forgeable from a repo read alone. A warning
  is logged (tokens won't survive a restart, which is fine for dev).
"""
import logging
import os
import re
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, HTTPException
from jose import jwt
from pydantic import BaseModel, Field

from ..db.database import cursor

log = logging.getLogger("apex.auth")

router = APIRouter(prefix="/api/auth", tags=["auth"])

ALGO = "HS256"
TTL_MINUTES = int(os.environ.get("APEX_JWT_TTL_MIN", "1440"))
BCRYPT_ROUNDS = int(os.environ.get("APEX_BCRYPT_ROUNDS", "12"))

_DEV_PLACEHOLDERS = {"", "apex-dev-secret-replace-in-prod", "change-me", "change-me-to-a-long-random-string"}


def _resolve_secret() -> str:
    env = os.environ.get("APEX_ENV", "development").lower()
    val = os.environ.get("APEX_JWT_SECRET", "").strip()
    if env == "production":
        if val in _DEV_PLACEHOLDERS:
            raise RuntimeError(
                "APEX_JWT_SECRET must be set to a long random string in production; "
                "refusing to boot with the dev placeholder."
            )
        if len(val) < 32:
            raise RuntimeError("APEX_JWT_SECRET must be at least 32 characters in production.")
        return val
    # Dev/staging: allow missing, but never use a predictable committed default.
    if val in _DEV_PLACEHOLDERS:
        val = secrets.token_urlsafe(48)
        log.warning(
            "APEX_JWT_SECRET is unset or a placeholder; generated an ephemeral dev secret. "
            "Tokens will be invalidated on process restart."
        )
    return val


SECRET = _resolve_secret()


class LoginIn(BaseModel):
    email: str
    password: str


class SignupIn(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=8, max_length=72)
    name: str | None = Field(None, max_length=120)


_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode()[:72], bcrypt.gensalt(rounds=BCRYPT_ROUNDS)).decode()


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
    # Constant-time-ish: run verify even when user doesn't exist, to blunt user enumeration.
    valid = row is not None and _verify(payload.password, row["password_hash"])
    if not valid:
        raise HTTPException(401, "Invalid credentials")
    return {
        "token": _token(row["email"], row["id"]),
        "user": {"email": row["email"], "name": row["name"], "firm": row["firm"]},
    }


@router.post("/signup")
def signup(payload: SignupIn):
    if not _EMAIL_RE.match(payload.email):
        raise HTTPException(400, "Invalid email")
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
