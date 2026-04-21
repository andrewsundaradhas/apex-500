"""Health, meta, and export endpoints."""
import csv
import io
import json
import time
from datetime import datetime

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..db.database import cursor

router = APIRouter(tags=["system"])

_started_at = time.time()


@router.get("/health")
def health():
    checks = {"status": "ok", "uptime_seconds": round(time.time() - _started_at, 1)}
    try:
        with cursor() as c:
            rows = c.execute("SELECT COUNT(*) AS n FROM users").fetchone()
        checks["db_ok"] = True
        checks["users"] = rows["n"] if rows else 0
    except Exception as e:
        checks["db_ok"] = False
        checks["db_error"] = str(e)
    try:
        import torch
        checks["torch"] = torch.__version__
    except Exception:
        checks["torch"] = None
    return checks


@router.get("/api/export/predictions.csv")
def export_predictions(ticker: str | None = None, limit: int = 200):
    with cursor() as c:
        if ticker:
            rows = c.execute(
                "SELECT ticker, horizon, model, target, delta_pct, confidence, created_at "
                "FROM predictions WHERE ticker = ? ORDER BY created_at DESC LIMIT ?",
                (ticker.upper(), limit),
            ).fetchall()
        else:
            rows = c.execute(
                "SELECT ticker, horizon, model, target, delta_pct, confidence, created_at "
                "FROM predictions ORDER BY created_at DESC LIMIT ?", (limit,),
            ).fetchall()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["ticker", "horizon", "model", "target", "delta_pct", "confidence", "created_at"])
    for r in rows:
        w.writerow([r["ticker"], r["horizon"], r["model"], r["target"], r["delta_pct"], r["confidence"], r["created_at"]])
    buf.seek(0)
    filename = f"predictions_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(buf, media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.get("/api/export/watchlist.csv")
def export_watchlist():
    from .watchlist import list_watchlist
    data = list_watchlist()
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["ticker", "name", "price", "delta", "pred5d", "signal"])
    for r in data["items"]:
        w.writerow([r["tk"], r["name"], r["price"], r["delta"], r["pred5d"], r["signal"]])
    buf.seek(0)
    return StreamingResponse(buf, media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=watchlist.csv"})
