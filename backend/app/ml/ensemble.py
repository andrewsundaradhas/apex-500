"""Ensemble forecaster: ARIMA + LSTM + Transformer + GradientBoost, confidence-weighted.

Each model contributes an independent forecast. The ensemble target is a weighted
mean; ensemble confidence is boosted when models agree on direction, penalized
when they disagree. The RF direction classifier acts as a final nudge.
"""
from __future__ import annotations

import logging
from typing import Dict, List

import numpy as np
import pandas as pd

from .boost import boost_forecast
from .classical import arima_forecast, rf_direction
from .features import garch_volatility_forecast
from .lstm import lstm_forecast
from .transformer import transformer_forecast

log = logging.getLogger("apex.ml.ensemble")


def _horizon_steps(horizon: str) -> int:
    return {"1d": 1, "5d": 5, "1m": 22}.get(horizon.lower(), 5)


def _series_to_list(forecast: List[float], current: float, steps: int) -> List[float]:
    return [current] + list(forecast[:steps])


def predict(
    series: pd.Series,
    horizon: str = "5d",
    model: str = "ensemble",
    ohlcv: pd.DataFrame | None = None,
    macro: dict | None = None,
    sentiment: float | None = None,
) -> Dict:
    """Run a forecast. `series` is the close-only price series.

    Optional `ohlcv` (full DataFrame with high/low/volume) + `macro` + `sentiment`
    are forwarded to the boost model which can use them as extra features.
    """
    steps = _horizon_steps(horizon)
    current = float(series.iloc[-1])

    if model == "lstm":
        r = lstm_forecast(series, horizon=steps, epochs=25)
        target = float(r["forecast"][-1])
        return _shape(r["model"], horizon, target, current, r["forecast"], r["confidence"],
                      metadata={"train_loss": r.get("train_loss"), "val_loss": r.get("val_loss")})

    if model == "transformer":
        r = transformer_forecast(series, horizon=steps, epochs=40)
        target = float(r["forecast"][-1])
        return _shape(r["model"], horizon, target, current, r["forecast"], r["confidence"],
                      metadata={"train_loss": r.get("train_loss"), "val_loss": r.get("val_loss")})

    if model == "arima":
        r = arima_forecast(series, horizon=steps)
        target = float(r["forecast"][-1])
        return _shape(r["model"], horizon, target, current, r["forecast"], r["confidence"],
                      lower=r["lower"], upper=r["upper"])

    if model == "boost":
        boost_input = ohlcv if ohlcv is not None else series
        r = boost_forecast(boost_input, horizon=steps, macro=macro, sentiment=sentiment)
        target = float(r["forecast"][-1])
        return _shape(r["model"], horizon, target, current, r["forecast"], r["confidence"],
                      metadata={"feature_importance": r.get("feature_importance"),
                                "val_r2": r.get("val_r2"),
                                "n_features": r.get("n_features")})

    # ---- Ensemble: all four models, confidence-weighted ----
    arima = arima_forecast(series, horizon=steps)
    lstm  = lstm_forecast(series, horizon=steps, epochs=20)
    trans = transformer_forecast(series, horizon=steps, epochs=30)
    boost_input = ohlcv if ohlcv is not None else series
    boost = boost_forecast(boost_input, horizon=steps, macro=macro, sentiment=sentiment)
    rf    = rf_direction(series, horizon=steps)

    models = [
        ("arima", arima),
        ("lstm",  lstm),
        ("transformer", trans),
        ("boost", boost),
    ]

    weights = np.array([m[1]["confidence"] for m in models])
    weights = weights / weights.sum()

    # Blend forecasts step-by-step
    blended = []
    for i in range(steps):
        v = sum(weights[k] * models[k][1]["forecast"][i] for k in range(len(models)))
        blended.append(float(v))

    target = float(blended[-1])

    # Directional agreement → confidence boost
    directions = [np.sign(m[1]["forecast"][-1] - current) for m in models]
    agree_frac = max(directions.count(1), directions.count(-1)) / len(directions)
    base_conf = float(np.mean([m[1]["confidence"] for m in models]))
    confidence = float(max(0.58, min(0.92, base_conf + (agree_frac - 0.5) * 0.2)))

    # RF nudge: if RF strongly disagrees with the ensemble sign, widen CI (indicated via confidence drop)
    rf_prob = rf.get("probability_up", 0.5)
    ensemble_up = np.sign(target - current) > 0
    if (ensemble_up and rf_prob < 0.35) or ((not ensemble_up) and rf_prob > 0.65):
        confidence = max(0.55, confidence - 0.06)

    # GARCH-based CI band for the ensemble
    try:
        vols = garch_volatility_forecast(series.pct_change(), steps)
        lower = [blended[i] * (1 - 1.96 * vols[i] * np.sqrt(i + 1)) for i in range(steps)]
        upper = [blended[i] * (1 + 1.96 * vols[i] * np.sqrt(i + 1)) for i in range(steps)]
    except Exception:
        lower = arima["lower"]
        upper = arima["upper"]

    return {
        "model": "Ensemble",
        "horizon": horizon,
        "target": round(target, 2),
        "delta_pct": round((target - current) / current * 100, 3),
        "confidence": round(confidence, 3),
        "series": _series_to_list([round(x, 2) for x in blended], current, steps),
        "lower": [round(x, 2) for x in lower],
        "upper": [round(x, 2) for x in upper],
        "metadata": {
            "agreement_frac": round(float(agree_frac), 2),
            "rf_signal": rf["signal"],
            "rf_probability_up": rf_prob,
            "component_models": [
                {"name": name, "target": round(r["forecast"][-1], 2),
                 "delta_pct": round((r["forecast"][-1] - current) / current * 100, 3),
                 "confidence": r["confidence"], "weight": round(float(weights[i]), 3)}
                for i, (name, r) in enumerate(models)
            ],
            "feature_importance": boost.get("feature_importance", {}),
        },
    }


def _shape(model_name: str, horizon: str, target: float, current: float,
           forecast: List[float], confidence: float,
           lower: List[float] | None = None, upper: List[float] | None = None,
           metadata: Dict | None = None) -> Dict:
    return {
        "model": model_name,
        "horizon": horizon,
        "target": round(target, 2),
        "delta_pct": round((target - current) / current * 100, 3),
        "confidence": confidence,
        "series": _series_to_list([round(x, 2) for x in forecast], current, len(forecast)),
        "lower": [round(x, 2) for x in lower] if lower else None,
        "upper": [round(x, 2) for x in upper] if upper else None,
        "metadata": metadata or {},
    }
