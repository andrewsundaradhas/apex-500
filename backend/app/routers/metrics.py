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


@router.get("/accuracy")
def accuracy(
    ticker: str | None = None,
    model: str | None = None,
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(2000, ge=1, le=5000),
):
    """Rolling realized accuracy for predictions that have been resolved."""
    where = ["resolved_at IS NOT NULL", "actual IS NOT NULL"]
    params: list = []
    if ticker:
        where.append("ticker = ?")
        params.append(ticker.upper())
    if model:
        where.append("LOWER(model) = ?")
        params.append(model.lower())
    where.append("created_at >= datetime('now', ?)")
    params.append(f"-{int(days)} day")

    sql = f"""
        SELECT id, ticker, horizon, model, target, delta_pct, actual, actual_delta_pct, error_pct, created_at, resolved_at
        FROM predictions
        WHERE {' AND '.join(where)}
        ORDER BY created_at DESC
        LIMIT ?
    """
    params.append(int(limit))

    with cursor() as c:
        rows = c.execute(sql, tuple(params)).fetchall()

    items = [dict(r) for r in rows]
    if not items:
        return {"items": [], "summary": {"n": 0}}

    # Summary stats computed in Python (SQLite portability).
    import math

    def _sgn(x: float) -> int:
        return 1 if x > 0 else (-1 if x < 0 else 0)

    abs_err = [abs(float(i.get("error_pct") or 0.0)) for i in items]
    mae = sum(abs_err) / len(abs_err) if abs_err else 0.0

    hits = 0
    hit_n = 0
    for i in items:
        if i.get("actual_delta_pct") is None or i.get("delta_pct") is None:
            continue
        hit_n += 1
        hits += 1 if _sgn(float(i["actual_delta_pct"])) == _sgn(float(i["delta_pct"])) else 0
    hit_rate = hits / hit_n if hit_n else None

    rmse = math.sqrt(sum((float(i.get("error_pct") or 0.0) ** 2) for i in items) / len(items)) if items else 0.0

    return {
        "items": items,
        "summary": {
            "n": len(items),
            "mae_error_pct": round(mae, 4),
            "rmse_error_pct": round(rmse, 4),
            "directional_hit_rate": round(hit_rate, 4) if hit_rate is not None else None,
        },
    }
