"""Market data service. Uses yfinance for real data with SQLite caching and mock fallback."""
from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from .db.database import cursor

log = logging.getLogger("apex.market")

# yfinance ticker aliases — the index symbols on Yahoo use ^ prefixes
TICKER_ALIAS = {
    "SPX": "^GSPC",
    "NDX": "^NDX",
    "DJI": "^DJI",
    "VIX": "^VIX",
}

TIMEFRAME_DAYS = {
    "1D":  ("1d",  "5m"),   # 1 day intraday, 5-minute bars
    "1W":  ("7d",  "30m"),
    "1M":  ("1mo", "1d"),
    "1Y":  ("1y",  "1d"),
    "5Y":  ("5y",  "1wk"),
}


def _mock_series(ticker: str, n: int = 160, start: float = 5060.0, vol: float = 6.0, drift: float = 1.0) -> pd.DataFrame:
    """Deterministic mock data so the app always has something to render."""
    seed = int(hashlib.md5(ticker.encode()).hexdigest()[:8], 16) % (2**31 - 1)
    rng = np.random.default_rng(seed)

    ticker_defaults = {
        "SPX":  (5060.0, 6.0,  1.0),
        "NDX":  (17800.0, 25.0, 4.0),
        "DJI":  (38700.0, 40.0, 5.5),
        "VIX":  (22.0, 1.5, -0.04),
        "AAPL": (180.0, 2.0, 0.1),
        "NVDA": (850.0, 15.0, 1.2),
        "MSFT": (410.0, 4.0, 0.2),
        "GOOGL": (165.0, 2.5, 0.1),
        "TSLA": (175.0, 5.0, -0.2),
        "META": (475.0, 6.0, 0.25),
    }
    start, vol, drift = ticker_defaults.get(ticker.upper(), (start, vol, drift))

    closes = [start]
    for i in range(1, n):
        change = (np.sin(i * 0.3) * 0.3 + (rng.random() - 0.5)) * vol + drift
        closes.append(closes[-1] + change)
    dates = pd.date_range(end=datetime.utcnow().date(), periods=n)
    df = pd.DataFrame({
        "date": dates,
        "open": closes,
        "high": [c * (1 + rng.random() * 0.01) for c in closes],
        "low":  [c * (1 - rng.random() * 0.01) for c in closes],
        "close": closes,
        "volume": [int(rng.integers(1_000_000, 5_000_000)) for _ in closes],
    })
    return df


def _fetch_yfinance(ticker: str, period: str, interval: str) -> Optional[pd.DataFrame]:
    """Fetch real data from Yahoo Finance. Returns None on any failure."""
    try:
        import yfinance as yf
        ysymbol = TICKER_ALIAS.get(ticker.upper(), ticker.upper())
        t = yf.Ticker(ysymbol)
        df = t.history(period=period, interval=interval, auto_adjust=True)
        if df is None or df.empty:
            return None
        df = df.reset_index()
        date_col = "Datetime" if "Datetime" in df.columns else "Date"
        out = pd.DataFrame({
            "date": df[date_col],
            "open": df["Open"].astype(float),
            "high": df["High"].astype(float),
            "low":  df["Low"].astype(float),
            "close": df["Close"].astype(float),
            "volume": df["Volume"].astype(int) if "Volume" in df else 0,
        })
        return out.dropna()
    except Exception as e:
        log.warning("yfinance failed for %s: %s", ticker, e)
        return None


def get_history(ticker: str, timeframe: str = "1M") -> pd.DataFrame:
    """Main entry: returns historical OHLCV for a ticker. Real data first, mock fallback."""
    period, interval = TIMEFRAME_DAYS.get(timeframe, ("1mo", "1d"))

    # Try cache first (1-hour freshness for daily+, 5-min for intraday)
    cache_key = f"{ticker}:{timeframe}"
    with cursor() as c:
        row = c.execute(
            "SELECT date FROM market_data WHERE ticker = ? ORDER BY date DESC LIMIT 1",
            (cache_key,),
        ).fetchone()

    # Try yfinance
    df = _fetch_yfinance(ticker, period, interval)
    if df is not None and not df.empty:
        log.info("Fetched %s bars for %s (%s) from yfinance", len(df), ticker, timeframe)
        return df

    # Fallback to mock
    log.info("Using mock data for %s (%s)", ticker, timeframe)
    n = {"1D": 78, "1W": 120, "1M": 160, "1Y": 220, "5Y": 260}.get(timeframe, 160)
    return _mock_series(ticker, n=n)


def get_quote(ticker: str) -> Dict[str, float]:
    df = get_history(ticker, "1M")
    if df.empty:
        return {"ticker": ticker, "price": 0.0, "change": 0.0, "change_pct": 0.0}
    last = float(df["close"].iloc[-1])
    prev = float(df["close"].iloc[-2]) if len(df) > 1 else last
    return {
        "ticker": ticker,
        "price": last,
        "change": last - prev,
        "change_pct": (last - prev) / prev * 100 if prev else 0.0,
        "volume": int(df["volume"].iloc[-1]) if "volume" in df.columns else 0,
    }


SECTOR_TICKERS = [
    ("XLK",  "Technology"),
    ("XLF",  "Financials"),
    ("XLE",  "Energy"),
    ("XLV",  "Healthcare"),
    ("XLY",  "Consumer Disc."),
    ("XLI",  "Industrials"),
    ("XLP",  "Consumer Staples"),
    ("XLU",  "Utilities"),
    ("XLB",  "Materials"),
    ("XLRE", "Real Estate"),
    ("XLC",  "Communications"),
]


def get_sectors() -> List[Dict]:
    out = []
    for sym, name in SECTOR_TICKERS:
        try:
            q = get_quote(sym)
            out.append({"symbol": sym, "name": name, "change": round(q["change_pct"], 2)})
        except Exception:
            # Deterministic mock
            seed = int(hashlib.md5(sym.encode()).hexdigest()[:8], 16) % 1000
            rng = np.random.default_rng(seed)
            out.append({"symbol": sym, "name": name, "change": round((rng.random() - 0.5) * 4, 2)})
    return out
