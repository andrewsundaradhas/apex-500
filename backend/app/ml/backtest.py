"""Walk-forward backtest for any forecaster.

For each window, train on [0..i], predict `horizon` steps, score against ground truth.
Reports MAE, RMSE, MAPE, directional hit rate, and Sharpe of a naive long-on-up strategy.
"""
from __future__ import annotations

from typing import Callable, Dict, List

import numpy as np
import pandas as pd


def backtest(series: pd.Series, forecaster: Callable[[pd.Series, int], Dict],
             horizon: int = 5, step: int = 5, min_train: int = 100, max_folds: int = 40) -> Dict:
    """Walk-forward evaluation.

    forecaster(train_series, horizon) → {"forecast": [...]}.
    Returns aggregated metrics + per-fold records.
    """
    data = series.dropna().astype(float)
    folds: List[Dict] = []

    idx = min_train
    fold_count = 0
    while idx + horizon < len(data) and fold_count < max_folds:
        train = data.iloc[:idx]
        actual = data.iloc[idx:idx + horizon].values
        pred = forecaster(train, horizon).get("forecast", [])
        if len(pred) < horizon:
            idx += step
            continue
        pred = np.array(pred[:horizon])

        # Per-fold metrics
        pct_err = (pred - actual) / actual
        last_train = float(train.iloc[-1])
        pred_dir = np.sign(pred[-1] - last_train)
        actual_dir = np.sign(actual[-1] - last_train)

        folds.append({
            "train_end": int(idx),
            "actual_end": float(actual[-1]),
            "pred_end":   float(pred[-1]),
            "mae":  float(np.mean(np.abs(pred - actual))),
            "mape": float(np.mean(np.abs(pct_err)) * 100),
            "hit":  bool(pred_dir == actual_dir),
            "predicted_return": float((pred[-1] - last_train) / last_train),
            "actual_return":    float((actual[-1] - last_train) / last_train),
        })
        idx += step
        fold_count += 1

    if not folds:
        return {"n_folds": 0, "error": "insufficient data for backtest"}

    maes = [f["mae"]  for f in folds]
    mapes = [f["mape"] for f in folds]
    hits = [f["hit"]  for f in folds]

    # Naive strategy: enter long when model predicts up, flat otherwise
    strat_rets = [f["actual_return"] for f in folds if f["predicted_return"] > 0]
    if strat_rets:
        mu = float(np.mean(strat_rets))
        sd = float(np.std(strat_rets) or 1e-9)
        sharpe = float(mu / sd * np.sqrt(252 / max(horizon, 1)))
    else:
        sharpe = 0.0

    return {
        "n_folds": len(folds),
        "horizon": horizon,
        "mae_mean":  round(float(np.mean(maes)), 3),
        "mae_std":   round(float(np.std(maes)), 3),
        "mape_mean": round(float(np.mean(mapes)), 3),
        "rmse":      round(float(np.sqrt(np.mean([m ** 2 for m in maes]))), 3),
        "hit_rate":  round(sum(hits) / len(hits), 3),
        "strategy_trades": len(strat_rets),
        "strategy_sharpe": round(sharpe, 3),
        "strategy_mean_return": round(float(np.mean(strat_rets)), 4) if strat_rets else 0.0,
        "folds": folds,
    }
