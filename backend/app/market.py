"""Market data service. Finnhub → yfinance → Stooq CSV → mock fallback, with in-memory TTL cache."""
from __future__ import annotations

import hashlib
import io
import logging
import os
import urllib.request
from datetime import datetime
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from . import cache
from .db.database import cursor

log = logging.getLogger("apex.market")

HISTORY_TTL_SECONDS = int(os.environ.get("APEX_HISTORY_TTL", "300"))  # 5 min
FINNHUB_KEY = os.environ.get("APEX_FINNHUB_KEY", "").strip()

# yfinance ticker aliases — the index symbols on Yahoo use ^ prefixes
TICKER_ALIAS = {
    "SPX": "^GSPC",
    "NDX": "^NDX",
    "DJI": "^DJI",
    "VIX": "^VIX",
}

# Stooq symbol map (US equities get the .us suffix; indices have their own symbols)
STOOQ_ALIAS = {
    "SPX": "^spx",
    "NDX": "^ndx",
    "DJI": "^dji",
    "VIX": "^vix",
}

TIMEFRAME_DAYS = {
    "1D":  ("1d",  "5m"),
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


def _finnhub_symbol(ticker: str) -> str:
    # Finnhub uses standard symbols (e.g. SPY, AAPL). Indices require special
    # prefixes; we handle a few common ones.
    t = ticker.upper()
    if t == "SPX":
        return "OANDA:SPX500_USD"
    if t == "NDX":
        return "NDX"
    if t == "DJI":
        return "DJI"
    if t == "VIX":
        return "VIX"
    return t


def _fetch_finnhub(ticker: str, timeframe: str) -> Optional[pd.DataFrame]:
    """Finnhub candles endpoint. Requires `APEX_FINNHUB_KEY`."""
    if not FINNHUB_KEY:
        return None
    try:
        import httpx
        import time
        from .monitoring import monitor
        from .logging_config import log_api_usage

        start_time = time.time()
        symbol = _finnhub_symbol(ticker)
        # Map our timeframe to Finnhub resolution + lookback window.
        now = int(datetime.utcnow().timestamp())
        days_back = {"1D": 7, "1W": 30, "1M": 120, "1Y": 400, "5Y": 2200}.get(timeframe, 120)
        frm = now - days_back * 86400
        resolution = {"1D": "5", "1W": "15", "1M": "60", "1Y": "D", "5Y": "W"}.get(timeframe, "60")

        url = "https://finnhub.io/api/v1/stock/candle"
        params = {"symbol": symbol, "resolution": resolution, "from": frm, "to": now, "token": FINNHUB_KEY}
        with httpx.Client(timeout=6.0) as client:
            r = client.get(url, params=params)
            r.raise_for_status()
            payload = r.json()
        
        response_time = time.time() - start_time
        
        if payload.get("s") != "ok":
            log.warning("finnhub bad response for %s: %s", ticker, payload)
            monitor.record_api_call("finnhub", success=False)
            log_api_usage("finnhub", ticker, False, response_time)
            return None
            
        t = payload.get("t") or []
        if not t:
            log.warning("finnhub empty data for %s", ticker)
            monitor.record_api_call("finnhub", success=False)
            log_api_usage("finnhub", ticker, False, response_time)
            return None
            
        df = pd.DataFrame({
            "date": pd.to_datetime(payload["t"], unit="s"),
            "open": payload["o"],
            "high": payload["h"],
            "low": payload["l"],
            "close": payload["c"],
            "volume": payload.get("v") or [0] * len(payload["t"]),
        })
        df = df.dropna()
        
        # Record successful API call
        monitor.record_api_call("finnhub", success=True)
        log_api_usage("finnhub", ticker, True, response_time)
        log.info("finnhub success: %s (%s) %d bars in %.2fs", ticker, timeframe, len(df), response_time)
        
        return df.tail(_bars_for_timeframe(timeframe)).reset_index(drop=True)
    except Exception as e:
        log.warning("finnhub failed for %s: %s", ticker, e)
        from .monitoring import monitor
        from .logging_config import log_api_usage
        monitor.record_api_call("finnhub", success=False)
        log_api_usage("finnhub", ticker, False)
        return None


def _fetch_stooq(ticker: str, timeframe: str) -> Optional[pd.DataFrame]:
    """Stooq CSV endpoint — free, no API key, covers US equities + major indices.
    Timeframes map to Stooq interval codes: d (daily), w (weekly), m (monthly)."""
    try:
        sym = STOOQ_ALIAS.get(ticker.upper())
        if not sym:
            # US equities on Stooq use the .us suffix
            sym = f"{ticker.lower()}.us"
        interval_code = {"1D": "d", "1W": "d", "1M": "d", "1Y": "d", "5Y": "w"}.get(timeframe, "d")
        url = f"https://stooq.com/q/d/l/?s={sym}&i={interval_code}"
        req = urllib.request.Request(url, headers={"User-Agent": "apex-500/1.0"})
        with urllib.request.urlopen(req, timeout=6) as resp:
            raw = resp.read().decode("utf-8")
        df = pd.read_csv(io.StringIO(raw))
        if df.empty or "Date" not in df.columns:
            return None
        df = df.rename(columns={c: c.lower() for c in df.columns})
        out = pd.DataFrame({
            "date":   pd.to_datetime(df["date"]),
            "open":   df["open"].astype(float),
            "high":   df["high"].astype(float),
            "low":    df["low"].astype(float),
            "close":  df["close"].astype(float),
            "volume": df["volume"].fillna(0).astype(int) if "volume" in df.columns else 0,
        }).dropna().tail(_bars_for_timeframe(timeframe))
        return out.reset_index(drop=True)
    except Exception as e:
        log.warning("stooq failed for %s: %s", ticker, e)
        return None


def _bars_for_timeframe(timeframe: str) -> int:
    return {"1D": 78, "1W": 120, "1M": 160, "1Y": 260, "5Y": 260}.get(timeframe, 160)


def get_history(ticker: str, timeframe: str = "1M") -> pd.DataFrame:
    """Main entry: returns historical OHLCV. Finnhub → yfinance → Stooq → mock."""
    ck = f"history:{ticker.upper()}:{timeframe}"
    hit = cache.get(ck)
    if hit is not None:
        return hit.copy()

    period, interval = TIMEFRAME_DAYS.get(timeframe, ("1mo", "1d"))

    df = _fetch_finnhub(ticker, timeframe)
    source = "finnhub"
    if df is None or df.empty:
        df = _fetch_yfinance(ticker, period, interval)
        source = "yfinance"
    if df is None or df.empty:
        df = _fetch_stooq(ticker, timeframe)
        source = "stooq"
    if df is None or df.empty:
        df = _mock_series(ticker, n=_bars_for_timeframe(timeframe))
        source = "mock"

    log.info("history %s (%s) via %s → %d bars", ticker, timeframe, source, len(df))
    cache.set(ck, df.copy(), ttl_seconds=HISTORY_TTL_SECONDS)
    return df


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
            seed = int(hashlib.md5(sym.encode()).hexdigest()[:8], 16) % 1000
            rng = np.random.default_rng(seed)
            out.append({"symbol": sym, "name": name, "change": round((rng.random() - 0.5) * 4, 2)})
    return out
