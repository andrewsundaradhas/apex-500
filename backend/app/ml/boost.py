"""Gradient-boosted regression for return forecasting.

sklearn GradientBoostingRegressor on the centralized feature matrix.
"""
from __future__ import annotations

import logging
from typing import Dict

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor

from .features import feature_matrix

log = logging.getLogger("apex.ml.boost")


def boost_forecast(series: pd.Series, horizon: int = 5) -> Dict:
    """Predict the return `horizon` steps ahead, then back out a target price.

    Returns feature_importances too — handy for the frontend's signal panel.
    """
    X, cols = feature_matrix(series)
    if len(X) < 50:
        last = float(series.iloc[-1])
        return {"forecast": [last] * horizon, "confidence": 0.55, "model": "Boost-fallback", "feature_importance": {}}

    # Label: forward return over horizon
    y = (series.shift(-horizon) / series - 1).reindex(X.index).dropna()
    X = X.loc[y.index]

    if len(X) < 50:
        last = float(series.iloc[-1])
        return {"forecast": [last] * horizon, "confidence": 0.55, "model": "Boost-fallback", "feature_importance": {}}

    split = int(len(X) * 0.8)
    X_tr, X_va = X.iloc[:split].values, X.iloc[split:].values
    y_tr, y_va = y.iloc[:split].values, y.iloc[split:].values

    gb = GradientBoostingRegressor(
        n_estimators=150, max_depth=3, learning_rate=0.05,
        subsample=0.9, random_state=42,
    )
    gb.fit(X_tr, y_tr)

    val_r2 = float(gb.score(X_va, y_va)) if len(X_va) else 0.5
    pred_ret = float(gb.predict(X.iloc[-1:].values)[0])

    current = float(series.iloc[-1])
    # Distribute the total return roughly linearly across steps
    forecast = [current * (1 + pred_ret * (i + 1) / horizon) for i in range(horizon)]

    # Confidence: bounded transform of validation R² (R² can be negative on OOS data)
    conf = float(max(0.55, min(0.88, 0.70 + val_r2 * 0.3)))

    importance = dict(sorted(
        zip(cols, [float(x) for x in gb.feature_importances_]),
        key=lambda kv: kv[1], reverse=True,
    )[:8])

    return {
        "forecast": forecast,
        "confidence": round(conf, 3),
        "model": "GradientBoost",
        "feature_importance": {k: round(v, 4) for k, v in importance.items()},
        "val_r2": round(val_r2, 3),
        "predicted_return": round(pred_ret, 4),
    }
