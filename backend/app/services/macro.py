"""FRED macro indicators.

Uses FRED. Prefers the official API when `APEX_FRED_API_KEY` is set; otherwise
falls back to the public fredgraph CSV endpoint. Falls back to mock when the
network is unavailable.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime
from io import StringIO
from typing import Dict, List

import numpy as np
import pandas as pd

from ..db.database import cursor

log = logging.getLogger("apex.services.macro")
FRED_API_KEY = os.environ.get("APEX_FRED_API_KEY", "").strip()

# Headline indicators that drive the what-if panel + insights
SERIES = {
    "FEDFUNDS": "Federal Funds Effective Rate",
    "CPIAUCSL": "Consumer Price Index (All Urban)",
    "UNRATE":   "Unemployment Rate",
    "GDP":      "Gross Domestic Product",
    "DGS10":    "10-Year Treasury Yield",
    "VIXCLS":   "CBOE VIX",
}


def _fallback(series_id: str) -> List[Dict]:
    """Procedural but reasonable fallback values so the UI always has data."""
    anchors = {
        "FEDFUNDS": (5.33, 0.02),
        "CPIAUCSL": (312.0, 0.8),
        "UNRATE":   (3.9, 0.05),
        "GDP":      (28000.0, 60),
        "DGS10":    (4.6, 0.05),
        "VIXCLS":   (15.0, 1.5),
    }
    base, noise = anchors.get(series_id, (100.0, 1.0))
    rng = np.random.default_rng(hash(series_id) & 0xFFFFFFFF)
    today = datetime.utcnow().date()
    return [
        {"date": str(pd.Timestamp(today) - pd.Timedelta(days=30 * i)),
         "value": round(float(base + rng.normal(0, noise) + i * noise * 0.05), 3)}
        for i in range(24)
    ][::-1]


def fetch_series(series_id: str, limit: int = 240) -> List[Dict]:
    """Fetch a FRED series, cache in SQLite, return newest N rows."""
    # Try network first
    try:
        if FRED_API_KEY:
            import httpx

            url = "https://api.stlouisfed.org/fred/series/observations"
            params = {
                "series_id": series_id,
                "api_key": FRED_API_KEY,
                "file_type": "json",
                "sort_order": "asc",
            }
            with httpx.Client(timeout=8.0) as client:
                r = client.get(url, params=params)
                r.raise_for_status()
                data = r.json()
            obs = data.get("observations") or []
            df = pd.DataFrame(obs)
            if df.empty or "date" not in df.columns or "value" not in df.columns:
                raise RuntimeError("empty FRED response")
            df["value"] = pd.to_numeric(df["value"], errors="coerce")
            df = df.dropna(subset=["value"]).tail(limit)
            rows = [{"date": str(d), "value": float(v)} for d, v in zip(df["date"], df["value"])]
        else:
            import urllib.request

            url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}"
            with urllib.request.urlopen(url, timeout=8) as resp:
                raw = resp.read().decode("utf-8")
            df = pd.read_csv(StringIO(raw))
            df.columns = [c.lower() for c in df.columns]
            df = df.rename(columns={df.columns[0]: "date", df.columns[1]: "value"})
            df["value"] = pd.to_numeric(df["value"], errors="coerce")
            df = df.dropna().tail(limit)
            rows = [{"date": str(d.date() if hasattr(d, "date") else d), "value": float(v)}
                    for d, v in zip(pd.to_datetime(df["date"]), df["value"])]
        # Persist
        with cursor() as c:
            for r in rows:
                c.execute("INSERT OR REPLACE INTO macro_indicators (series_id, date, value) VALUES (?,?,?)",
                          (series_id, r["date"], r["value"]))
        src = "fred_api" if FRED_API_KEY else "fredgraph_csv"
        log.info("Fetched %d rows for %s from FRED (%s)", len(rows), series_id, src)
        return rows
    except Exception as e:
        log.warning("FRED fetch failed for %s: %s — using cache/fallback", series_id, e)

    # Cache
    with cursor() as c:
        rows = c.execute(
            "SELECT date, value FROM macro_indicators WHERE series_id = ? ORDER BY date DESC LIMIT ?",
            (series_id, limit),
        ).fetchall()
    if rows:
        return [{"date": r["date"], "value": r["value"]} for r in reversed(rows)]

    # Fallback
    fb = _fallback(series_id)
    with cursor() as c:
        for r in fb:
            c.execute("INSERT OR REPLACE INTO macro_indicators (series_id, date, value) VALUES (?,?,?)",
                      (series_id, r["date"], r["value"]))
    return fb


def ensure_seeded() -> None:
    for sid in SERIES:
        fetch_series(sid, limit=60)


def snapshot() -> Dict[str, Dict]:
    out = {}
    for sid, name in SERIES.items():
        rows = fetch_series(sid, limit=12)
        if not rows:
            continue
        latest = rows[-1]
        prev = rows[-4] if len(rows) > 3 else rows[0]
        out[sid] = {
            "name": name,
            "latest": latest["value"],
            "latest_date": latest["date"],
            "change_3m": round(latest["value"] - prev["value"], 3),
            "change_pct": round((latest["value"] / prev["value"] - 1) * 100, 3) if prev["value"] else 0.0,
            "history": rows,
        }
    return out
