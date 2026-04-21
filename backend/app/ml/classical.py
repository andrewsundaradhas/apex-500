"""Classical ML: ARIMA for time-series + RandomForest for directional classification."""
from __future__ import annotations

import logging
import warnings
from typing import Dict, List

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")
log = logging.getLogger("apex.ml.classical")


def _make_features(series: pd.Series) -> pd.DataFrame:
    """Classic technical indicators — the kind a junior quant would calculate."""
    df = pd.DataFrame({"close": series})
    df["ret1"]    = df["close"].pct_change()
    df["ret5"]    = df["close"].pct_change(5)
    df["ma10"]    = df["close"].rolling(10).mean()
    df["ma50"]    = df["close"].rolling(50).mean()
    df["vol10"]   = df["ret1"].rolling(10).std()
    df["mom10"]   = df["close"] / df["close"].shift(10) - 1
    # Simple RSI (14)
    delta = df["close"].diff()
    up = delta.clip(lower=0).rolling(14).mean()
    dn = (-delta.clip(upper=0)).rolling(14).mean()
    rs = up / dn.replace(0, np.nan)
    df["rsi14"]   = 100 - 100 / (1 + rs)
    return df


def arima_forecast(series: pd.Series, horizon: int = 5) -> Dict:
    """Fit a small ARIMA(1,1,1) and forecast `horizon` steps ahead.

    Returns dict with `forecast` (list), `lower`/`upper` (95% CI), and `confidence`.
    """
    from statsmodels.tsa.arima.model import ARIMA

    s = series.dropna().astype(float).values
    if len(s) < 30:
        # Fallback: trend extrapolation
        slope = (s[-1] - s[0]) / max(len(s), 1)
        forecast = [float(s[-1] + slope * (i + 1)) for i in range(horizon)]
        spread = float(np.std(np.diff(s)) if len(s) > 1 else 1.0)
        return {
            "forecast": forecast,
            "lower": [f - 2 * spread * np.sqrt(i + 1) for i, f in enumerate(forecast)],
            "upper": [f + 2 * spread * np.sqrt(i + 1) for i, f in enumerate(forecast)],
            "confidence": 0.55,
            "model": "ARIMA-fallback",
        }

    try:
        model = ARIMA(s, order=(1, 1, 1))
        fit = model.fit()
        fc = fit.get_forecast(steps=horizon)
        mean = fc.predicted_mean
        ci = fc.conf_int(alpha=0.05)
        # Confidence derived from tightness of CI vs in-sample residuals
        resid_std = float(np.std(fit.resid))
        ci_width = float(np.mean(ci[:, 1] - ci[:, 0]))
        # Narrower CI (relative to residuals) → higher confidence
        conf = max(0.50, min(0.85, 0.85 - (ci_width / (resid_std * 6))))
        return {
            "forecast": [float(x) for x in mean],
            "lower":    [float(x) for x in ci[:, 0]],
            "upper":    [float(x) for x in ci[:, 1]],
            "confidence": round(conf, 3),
            "model": "ARIMA(1,1,1)",
        }
    except Exception as e:
        log.warning("ARIMA fit failed: %s — falling back to trend", e)
        slope = float((s[-1] - s[-20]) / 20)
        forecast = [float(s[-1] + slope * (i + 1)) for i in range(horizon)]
        spread = float(np.std(np.diff(s[-40:])))
        return {
            "forecast": forecast,
            "lower": [f - 2 * spread * np.sqrt(i + 1) for i, f in enumerate(forecast)],
            "upper": [f + 2 * spread * np.sqrt(i + 1) for i, f in enumerate(forecast)],
            "confidence": 0.55,
            "model": "ARIMA-fallback",
        }


def rf_direction(series: pd.Series, horizon: int = 5) -> Dict:
    """Random forest classifier on direction (up/down) over `horizon` days.

    Returns {probability_up, signal ('Buy'/'Hold'/'Watch'/'Sell')}.
    """
    feats = _make_features(series).dropna()
    if len(feats) < 60:
        return {"probability_up": 0.5, "signal": "Hold", "model": "RF-insufficient-data"}

    X = feats[["ret1", "ret5", "ma10", "ma50", "vol10", "mom10", "rsi14"]].values
    # Label: did price rise over next `horizon` days?
    fwd = series.shift(-horizon) / series - 1
    y = (fwd > 0).astype(int).iloc[feats.index].values

    split = int(len(X) * 0.8)
    X_tr, X_te, y_tr, y_te = X[:split], X[split:], y[:split], y[split:]
    # Drop trailing NaN labels (fwd undefined)
    valid_tr = ~np.isnan(y_tr.astype(float))
    X_tr, y_tr = X_tr[valid_tr], y_tr[valid_tr]

    if len(X_tr) < 20 or len(set(y_tr)) < 2:
        return {"probability_up": 0.5, "signal": "Hold", "model": "RF-degenerate"}

    scaler = StandardScaler().fit(X_tr)
    clf = RandomForestClassifier(n_estimators=80, max_depth=6, random_state=42, n_jobs=1)
    clf.fit(scaler.transform(X_tr), y_tr)

    # Predict on most recent row
    latest = scaler.transform(X[-1:])
    proba = float(clf.predict_proba(latest)[0, 1])

    if   proba > 0.70: signal = "Strong buy"
    elif proba > 0.58: signal = "Buy"
    elif proba > 0.45: signal = "Hold"
    elif proba > 0.30: signal = "Watch"
    else:              signal = "Sell"

    return {
        "probability_up": round(proba, 3),
        "signal": signal,
        "model": "RandomForest",
        "n_train": int(len(X_tr)),
    }
