"""Background jobs to keep predictions warm and track realized accuracy."""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone

import pandas as pd
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from . import cache
from .db.database import cursor
from .market import get_history
from .ml.ensemble import predict as run_model

log = logging.getLogger("apex.scheduler")


HOT_TICKERS = [
    "SPX", "NDX", "DJI", "VIX",
    "AAPL", "NVDA", "MSFT", "GOOGL", "AMZN", "META",
    "TSLA", "AVGO", "JPM", "XOM", "UNH",
]
HORIZONS = ["1d", "5d", "1m"]


def _series_signature(df: pd.DataFrame) -> str:
    # Keep in sync with routers/predict.py
    import hashlib
    if df is None or df.empty:
        return "empty"
    tail = df.tail(10)
    raw = f"{tail['date'].iloc[-1]}:{round(float(tail['close'].iloc[-1]), 4)}:{len(df)}"
    return hashlib.md5(raw.encode()).hexdigest()[:10]


def refresh_hot_predictions() -> None:
    """Warm the prediction cache so user requests are cache hits."""
    ttl = int(os.environ.get("APEX_PREDICT_TTL", "900"))
    ok = 0
    for t in HOT_TICKERS:
        try:
            df = get_history(t, "1Y")
            sig = _series_signature(df)
            series = df["close"]
            for h in HORIZONS:
                key = f"predict:{t}:{h}:ensemble:{sig}"
                # If already warm, skip
                if cache.get(key) is not None:
                    continue
                r = run_model(series, horizon=h, model="ensemble", ohlcv=df)
                r["ticker"] = t
                r["cached"] = False
                cache.set(key, r, ttl_seconds=ttl)
                ok += 1
        except Exception as e:
            log.warning("refresh failed for %s: %s", t, e)
    if ok:
        log.info("warmed %d predictions", ok)


def _horizon_days(horizon: str) -> int:
    return {"1d": 1, "5d": 5, "1m": 30}.get(horizon.lower(), 5)


def resolve_prediction_accuracy(days_back: int = 14) -> int:
    """Fill in realized outcomes for older predictions.

    We store:
    - actual: realized close
    - actual_delta_pct: realized % move vs baseline close near created_at
    - error_pct: signed % error vs actual ( (target-actual)/actual*100 )
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days_back)).strftime("%Y-%m-%d %H:%M:%S")
    with cursor() as c:
        rows = c.execute(
            """
            SELECT id, ticker, horizon, model, target, delta_pct, created_at
            FROM predictions
            WHERE (actual IS NULL OR resolved_at IS NULL)
              AND created_at >= ?
            ORDER BY created_at ASC
            """,
            (cutoff,),
        ).fetchall()

    updated = 0
    for r in rows:
        try:
            pred_id = int(r["id"])
            ticker = str(r["ticker"]).upper()
            horizon = str(r["horizon"]).lower()
            target = float(r["target"])
            created_at = str(r["created_at"])

            # Parse sqlite CURRENT_TIMESTAMP (UTC-ish) as naive; treat as UTC.
            created_dt = datetime.fromisoformat(created_at.replace("Z", "")).replace(tzinfo=timezone.utc)
            end_dt = created_dt + timedelta(days=_horizon_days(horizon))

            df = get_history(ticker, "1Y")
            if df is None or df.empty:
                continue

            dfd = df.copy()
            dfd["date"] = pd.to_datetime(dfd["date"], utc=True, errors="coerce")
            dfd = dfd.dropna(subset=["date"])

            # Baseline close: last close at/ before created time
            base_rows = dfd[dfd["date"] <= created_dt]
            if base_rows.empty:
                base = float(dfd["close"].iloc[0])
            else:
                base = float(base_rows["close"].iloc[-1])

            # Actual close: first close at/after end_dt (or last available)
            act_rows = dfd[dfd["date"] >= end_dt]
            if act_rows.empty:
                actual = float(dfd["close"].iloc[-1])
            else:
                actual = float(act_rows["close"].iloc[0])

            actual_delta_pct = ((actual - base) / base * 100.0) if base else 0.0
            error_pct = ((target - actual) / actual * 100.0) if actual else 0.0

            with cursor() as c:
                c.execute(
                    """
                    UPDATE predictions
                    SET actual = ?,
                        actual_delta_pct = ?,
                        error_pct = ?,
                        resolved_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (actual, actual_delta_pct, error_pct, pred_id),
                )
            updated += 1
        except Exception as e:
            log.warning("resolve failed for id=%s: %s", r.get("id"), e)
    if updated:
        log.info("resolved %d predictions", updated)
    return updated


def evaluate_alerts_for_all_users() -> int:
    """Check every enabled alert and email the user when one fires."""
    from .market import get_quote
    from .services.email import send_email

    fired = 0
    with cursor() as c:
        rows = c.execute("""
            SELECT a.id, a.user_id, a.ticker, a.condition_type, a.threshold, a.note,
                   u.email
            FROM alerts a JOIN users u ON u.id = a.user_id
            WHERE a.enabled = 1
              AND (a.triggered_at IS NULL OR a.triggered_at < datetime('now', '-1 hour'))
        """).fetchall()

    for r in rows:
        try:
            q = get_quote(r["ticker"])
            price = q["price"]
            chg = q["change_pct"]
            ct = r["condition_type"]
            th = r["threshold"]
            triggered = (
                (ct == "price_above" and price >= th) or
                (ct == "price_below" and price <= th) or
                (ct == "pct_change" and abs(chg) >= th) or
                (ct == "vix_above" and r["ticker"] == "VIX" and price >= th)
            )
            if not triggered:
                continue
            ok = send_email(
                to=r["email"],
                subject=f"Apex alert: {r['ticker']} {ct.replace('_', ' ')} {th}",
                body=f"{r['ticker']} is now {price:.2f} ({chg:+.2f}%).\n\nNote: {r['note'] or '—'}",
            )
            if ok:
                with cursor() as c:
                    c.execute("UPDATE alerts SET triggered_at = CURRENT_TIMESTAMP WHERE id = ?", (r["id"],))
                fired += 1
        except Exception as e:
            log.warning("alert eval failed for id=%s: %s", r["id"], e)
    return fired


def build_scheduler() -> AsyncIOScheduler:
    s = AsyncIOScheduler(timezone="UTC")
    s.add_job(refresh_hot_predictions, IntervalTrigger(minutes=15), id="warm_predictions", coalesce=True, max_instances=1)
    # Run nightly after US market close (~21:00 UTC, varies with DST; good-enough baseline).
    s.add_job(lambda: resolve_prediction_accuracy(days_back=45), CronTrigger(hour=21, minute=0), id="resolve_accuracy",
              coalesce=True, max_instances=1)
    s.add_job(evaluate_alerts_for_all_users, IntervalTrigger(minutes=5),
              id="alert_emails", coalesce=True, max_instances=1)
    return s

