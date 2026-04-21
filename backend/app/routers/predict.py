import json
import logging

from fastapi import APIRouter, Query

from ..db.database import cursor
from ..market import get_history
from ..ml.ensemble import predict

router = APIRouter(prefix="/api/predict", tags=["predict"])
log = logging.getLogger("apex.predict")


@router.get("/{ticker}")
def run_prediction(
    ticker: str,
    horizon: str = Query("5d", description="1d | 5d | 1m"),
    model: str = Query("ensemble", description="lstm | transformer | arima | ensemble"),
):
    ticker = ticker.upper()
    df = get_history(ticker, "1Y")
    series = df["close"]
    result = predict(series, horizon=horizon, model=model)
    result["ticker"] = ticker

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
