"""Backtest endpoints: walk-forward evaluation of any forecaster."""
import json
import logging
from functools import partial

from fastapi import APIRouter, HTTPException, Query

from ..db.database import cursor
from ..market import get_history
from ..ml.backtest import backtest
from ..ml.boost import boost_forecast
from ..ml.classical import arima_forecast
from ..ml.ensemble import predict as ensemble_predict
from ..ml.lstm import lstm_forecast
from ..ml.transformer import transformer_forecast

router = APIRouter(prefix="/api/backtest", tags=["backtest"])
log = logging.getLogger("apex.backtest")


def _ensemble_forecaster(series, h):
    """Adapter so backtest() can call the ensemble with the same (series, h) signature."""
    r = ensemble_predict(series, horizon=f"{h}d" if h < 22 else "1m", model="ensemble")
    # ensemble_predict returns series[0] = current, [1:] = forecast
    return {"forecast": r["series"][1:1 + h]}


FORECASTERS = {
    "arima":       lambda s, h: arima_forecast(s, h),
    "lstm":        lambda s, h: lstm_forecast(s, h, epochs=15),
    "transformer": lambda s, h: transformer_forecast(s, h, epochs=20),
    "boost":       lambda s, h: boost_forecast(s, h),
    "ensemble":    _ensemble_forecaster,
}


@router.get("/{ticker}")
def run_backtest(
    ticker: str,
    model: str = Query("arima", description="arima | lstm | transformer | boost | ensemble"),
    horizon: int = Query(5, ge=1, le=30),
    step: int = Query(10, ge=1, le=50),
    max_folds: int = Query(20, ge=5, le=60),
):
    fn = FORECASTERS.get(model)
    if not fn:
        raise HTTPException(400, f"Unknown model: {model}")

    df = get_history(ticker.upper(), "5Y")
    series = df["close"]
    if len(series) < 150:
        raise HTTPException(400, "Insufficient history for backtest")

    result = backtest(series, fn, horizon=horizon, step=step, max_folds=max_folds, min_train=120)

    # Persist summary
    try:
        with cursor() as c:
            c.execute(
                "INSERT INTO model_runs (ticker, model, horizon, mae, rmse, hit_rate, sharpe, n_folds, payload_json)"
                " VALUES (?,?,?,?,?,?,?,?,?)",
                (ticker.upper(), model, str(horizon),
                 result.get("mae_mean"), result.get("rmse"),
                 result.get("hit_rate"), result.get("strategy_sharpe"),
                 result.get("n_folds"),
                 json.dumps({"mape_mean": result.get("mape_mean"),
                             "strategy_mean_return": result.get("strategy_mean_return")})),
            )
    except Exception as e:
        log.warning("failed to persist backtest: %s", e)

    return {"ticker": ticker.upper(), "model": model, **result}
