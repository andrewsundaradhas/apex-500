"""Watchlist endpoints — uses demo user until real auth is wired per request."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..db.database import cursor
from ..market import get_quote
from ..ml.classical import rf_direction
from ..market import get_history

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])

DEMO_USER_EMAIL = "demo@apex500.dev"


def _demo_user_id() -> int:
    with cursor() as c:
        row = c.execute("SELECT id FROM users WHERE email = ?", (DEMO_USER_EMAIL,)).fetchone()
    if row is None:
        raise HTTPException(500, "Demo user missing — was DB initialized?")
    return row["id"]


class AddTickerIn(BaseModel):
    ticker: str


COMPANY_NAMES = {
    "SPX": "S&P 500", "NDX": "Nasdaq 100", "DJI": "Dow Jones", "VIX": "Volatility",
    "AAPL": "Apple", "NVDA": "Nvidia", "MSFT": "Microsoft", "GOOGL": "Alphabet",
    "TSLA": "Tesla", "META": "Meta",
}

MARKET_CAPS = {
    "AAPL": 2840, "NVDA": 2250, "MSFT": 3090, "GOOGL": 2130,
    "TSLA": 546, "META": 1240,
}


@router.get("")
def list_watchlist():
    uid = _demo_user_id()
    with cursor() as c:
        rows = c.execute("SELECT ticker FROM watchlist WHERE user_id = ? ORDER BY id", (uid,)).fetchall()

    items = []
    for r in rows:
        tk = r["ticker"]
        try:
            q = get_quote(tk)
            series = get_history(tk, "1Y")["close"]
            rf = rf_direction(series)
        except Exception:
            q = {"price": 0, "change_pct": 0, "volume": 0}
            rf = {"signal": "Hold", "probability_up": 0.5}

        items.append({
            "tk": tk,
            "name": COMPANY_NAMES.get(tk, tk),
            "price": round(q.get("price", 0), 2),
            "delta": round(q.get("change_pct", 0), 2),
            "up": q.get("change_pct", 0) >= 0,
            "vol": round(q.get("volume", 0) / 1_000_000, 1) if q.get("volume") else 2.0,
            "marketCap": MARKET_CAPS.get(tk, 0),
            "pred5d": round((rf["probability_up"] - 0.5) * 4, 2),  # rough mapping
            "signal": rf["signal"],
            "starred": True,
            "active": tk == "SPX",
            "warn": tk == "VIX",
        })
    return {"items": items}


@router.post("")
def add_ticker(payload: AddTickerIn):
    tk = payload.ticker.upper().strip()
    if not tk:
        raise HTTPException(400, "Empty ticker")
    uid = _demo_user_id()
    with cursor() as c:
        c.execute("INSERT OR IGNORE INTO watchlist (user_id, ticker) VALUES (?, ?)", (uid, tk))
    return {"ok": True, "ticker": tk}


@router.delete("/{ticker}")
def remove_ticker(ticker: str):
    uid = _demo_user_id()
    with cursor() as c:
        c.execute("DELETE FROM watchlist WHERE user_id = ? AND ticker = ?", (uid, ticker.upper()))
    return {"ok": True}
