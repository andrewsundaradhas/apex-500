"""User alerts — CRUD + evaluation."""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..db.database import cursor
from ..market import get_quote

router = APIRouter(prefix="/api/alerts", tags=["alerts"])
log = logging.getLogger("apex.alerts")

DEMO_USER_EMAIL = "demo@apex500.dev"


def _uid() -> int:
    with cursor() as c:
        r = c.execute("SELECT id FROM users WHERE email = ?", (DEMO_USER_EMAIL,)).fetchone()
    if not r:
        raise HTTPException(500, "Demo user missing")
    return r["id"]


class AlertIn(BaseModel):
    ticker: str
    condition_type: str          # price_above | price_below | pct_change | vix_above
    threshold: float
    note: Optional[str] = None
    enabled: bool = True


@router.get("")
def list_alerts():
    uid = _uid()
    with cursor() as c:
        rows = c.execute("SELECT * FROM alerts WHERE user_id = ? ORDER BY id DESC", (uid,)).fetchall()
    return {"items": [dict(r) for r in rows]}


@router.post("")
def create_alert(payload: AlertIn):
    if payload.condition_type not in ("price_above", "price_below", "pct_change", "vix_above", "prediction_change"):
        raise HTTPException(400, "Invalid condition_type")
    uid = _uid()
    with cursor() as c:
        c.execute(
            "INSERT INTO alerts (user_id, ticker, condition_type, threshold, note, enabled)"
            " VALUES (?,?,?,?,?,?)",
            (uid, payload.ticker.upper(), payload.condition_type, payload.threshold,
             payload.note or "", int(payload.enabled)),
        )
        new_id = c.lastrowid
    return {"ok": True, "id": new_id}


@router.patch("/{alert_id}")
def toggle_alert(alert_id: int, enabled: bool):
    with cursor() as c:
        c.execute("UPDATE alerts SET enabled = ? WHERE id = ?", (int(enabled), alert_id))
    return {"ok": True}


@router.delete("/{alert_id}")
def delete_alert(alert_id: int):
    with cursor() as c:
        c.execute("DELETE FROM alerts WHERE id = ?", (alert_id,))
    return {"ok": True}


@router.post("/evaluate")
def evaluate_alerts():
    """Check every enabled alert; mark triggered ones. Returns list of currently firing."""
    uid = _uid()
    firing = []
    with cursor() as c:
        alerts = c.execute("SELECT * FROM alerts WHERE user_id = ? AND enabled = 1", (uid,)).fetchall()

    for a in alerts:
        try:
            q = get_quote(a["ticker"])
            price = q["price"]
            change_pct = q["change_pct"]

            triggered = False
            if   a["condition_type"] == "price_above" and price >= a["threshold"]: triggered = True
            elif a["condition_type"] == "price_below" and price <= a["threshold"]: triggered = True
            elif a["condition_type"] == "pct_change"  and abs(change_pct) >= a["threshold"]: triggered = True
            elif a["condition_type"] == "vix_above"   and a["ticker"] == "VIX" and price >= a["threshold"]: triggered = True

            if triggered:
                firing.append({**dict(a), "current_price": price, "current_change_pct": change_pct})
                with cursor() as c:
                    c.execute("UPDATE alerts SET triggered_at = CURRENT_TIMESTAMP WHERE id = ?", (a["id"],))
        except Exception as e:
            log.warning("alert eval failed for id=%s: %s", a["id"], e)
            continue

    return {"firing": firing, "checked": len(alerts)}
