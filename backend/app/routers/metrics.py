"""Model metrics & prediction history endpoints."""
import json

from fastapi import APIRouter, Query

from ..db.database import cursor

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/models")
def list_model_runs(ticker: str | None = None, limit: int = 50):
    """Past backtest results — used by the predictions page 'performance' cards."""
    with cursor() as c:
        if ticker:
            rows = c.execute(
                "SELECT * FROM model_runs WHERE ticker = ? ORDER BY created_at DESC LIMIT ?",
                (ticker.upper(), limit),
            ).fetchall()
        else:
            rows = c.execute("SELECT * FROM model_runs ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        if d.get("payload_json"):
            try: d["payload"] = json.loads(d["payload_json"])
            except Exception: d["payload"] = None
            d.pop("payload_json", None)
        out.append(d)
    return {"items": out}


@router.get("/summary")
def metrics_summary():
    """Aggregate hit-rate / MAE per model — powers the 'model cards' on /predictions."""
    with cursor() as c:
        rows = c.execute("""
            SELECT model,
                   AVG(hit_rate)  AS avg_hit,
                   AVG(mae)       AS avg_mae,
                   AVG(rmse)      AS avg_rmse,
                   AVG(sharpe)    AS avg_sharpe,
                   COUNT(*)       AS n_runs
            FROM model_runs
            GROUP BY model
        """).fetchall()
    return {"models": [dict(r) for r in rows]}


@router.get("/predictions")
def prediction_history(ticker: str | None = None, limit: int = 40):
    with cursor() as c:
        if ticker:
            rows = c.execute(
                "SELECT * FROM predictions WHERE ticker = ? ORDER BY created_at DESC LIMIT ?",
                (ticker.upper(), limit),
            ).fetchall()
        else:
            rows = c.execute("SELECT * FROM predictions ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    return {"items": [dict(r) for r in rows]}
