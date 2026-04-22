"""Prediction endpoint with TTL cache.

Each (ticker, horizon, model) tuple caches for 15 minutes by default — keeps
the ensemble's ~4s of model-fitting off the hot path while still letting the
forecast freshen within an hour. Busts automatically if the underlying history
changes (keyed by last-bar date + close).
"""
import hashlib
import json
import logging
import os
from typing import Optional

from fastapi import APIRouter, Query

from .. import cache
from ..db.database import cursor
from ..market import get_history
from ..ml.ensemble import predict
from ..services import macro as macro_svc
from ..services import news as news_svc

router = APIRouter(prefix="/api/predict", tags=["predict"])
log = logging.getLogger("apex.predict")


def _macro_snapshot_flat() -> dict:
    """Latest value of each FRED series as a flat dict — cheap to read, cached."""
    hit = cache.get("macro:snapshot")
    if hit is not None:
        return hit
    try:
        snap = macro_svc.snapshot()
        flat = {k: v.get("latest") for k, v in snap.items() if v.get("latest") is not None}
    except Exception:
        flat = {}
    cache.set("macro:snapshot", flat, ttl_seconds=900)
    return flat


def _sentiment_for(ticker: str) -> float:
    ck = f"sentiment:{ticker}"
    hit = cache.get(ck)
    if hit is not None:
        return hit
    try:
        agg = news_svc.aggregate_sentiment(ticker if ticker not in ("SPX", "NDX", "DJI") else None)
        val = (agg.get("score", 50) - 50) / 50.0  # map 0-100 → [-1, 1]
    except Exception:
        val = 0.0
    cache.set(ck, val, ttl_seconds=900)
    return val

PREDICT_TTL_SECONDS = int(os.environ.get("APEX_PREDICT_TTL", "900"))


def _cache_key(ticker: str, horizon: str, model: str, series_sig: str) -> str:
    return f"predict:{ticker}:{horizon}:{model}:{series_sig}"


def _series_signature(df) -> str:
    """Short hash over the tail of the series so we only reuse cached results
    when the underlying data is the same."""
    if df is None or df.empty:
        return "empty"
    tail = df.tail(10)
    raw = f"{tail['date'].iloc[-1]}:{round(float(tail['close'].iloc[-1]), 4)}:{len(df)}"
    return hashlib.md5(raw.encode()).hexdigest()[:10]


@router.get("/{ticker}")
def run_prediction(
    ticker: str,
    horizon: str = Query("5d", description="1d | 5d | 1m"),
    model: str = Query("ensemble", description="lstm | transformer | arima | boost | ensemble"),
    force: bool = Query(False, description="bypass cache"),
):
    ticker = ticker.upper()
    df = get_history(ticker, "1Y")
    sig = _series_signature(df)
    key = _cache_key(ticker, horizon, model, sig)

    if not force:
        hit = cache.get(key)
        if hit is not None:
            return {**hit, "cached": True}

    series = df["close"]
    macro = _macro_snapshot_flat() if model in ("boost", "ensemble") else None
    sentiment = _sentiment_for(ticker) if model in ("boost", "ensemble") else None
    result = predict(
        series, horizon=horizon, model=model,
        ohlcv=df if model in ("boost", "ensemble") else None,
        macro=macro, sentiment=sentiment,
    )
    result["ticker"] = ticker
    result["cached"] = False

    cache.set(key, result, ttl_seconds=PREDICT_TTL_SECONDS)

    try:
        with cursor() as c:
            c.execute(
                "INSERT INTO predictions (ticker, horizon, model, target, delta_pct, confidence, series_json)"
                " VALUES (?, ?, ?, ?, ?, ?, ?)",
                (ticker, horizon, result["model"], result["target"], result["delta_pct"],
                 result["confidence"], json.dumps(result.get("series", []))),
            )
    except Exception as e:
        log.warning("failed to persist prediction: %s", e)

    return result
