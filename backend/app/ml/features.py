"""Centralized feature engineering for all models.

Every feature is deterministic given a close-price series. Kept here so classical
ML, boosting, and direction classification share one implementation.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def rsi(series: pd.Series, window: int = 14) -> pd.Series:
    delta = series.diff()
    up = delta.clip(lower=0).rolling(window).mean()
    dn = (-delta.clip(upper=0)).rolling(window).mean()
    rs = up / dn.replace(0, np.nan)
    return (100 - 100 / (1 + rs)).fillna(50.0)


def macd(series: pd.Series) -> tuple[pd.Series, pd.Series, pd.Series]:
    ema12 = series.ewm(span=12, adjust=False).mean()
    ema26 = series.ewm(span=26, adjust=False).mean()
    line = ema12 - ema26
    sig = line.ewm(span=9, adjust=False).mean()
    hist = line - sig
    return line, sig, hist


def bollinger(series: pd.Series, window: int = 20, std: float = 2.0) -> tuple[pd.Series, pd.Series, pd.Series]:
    ma = series.rolling(window).mean()
    sd = series.rolling(window).std()
    return ma + std * sd, ma, ma - std * sd


def atr_proxy(series: pd.Series, window: int = 14) -> pd.Series:
    """ATR from close-only data (approximation — real ATR needs OHL)."""
    return series.diff().abs().rolling(window).mean()


def build_features(series: pd.Series) -> pd.DataFrame:
    """Build a feature matrix from a close-price series.

    Returns a DataFrame aligned to the input index. Caller is expected to
    `.dropna()` before feeding into sklearn.
    """
    df = pd.DataFrame({"close": series})
    df["ret1"]     = df["close"].pct_change()
    df["ret5"]     = df["close"].pct_change(5)
    df["ret20"]    = df["close"].pct_change(20)
    df["ma10"]     = df["close"].rolling(10).mean() / df["close"] - 1
    df["ma50"]     = df["close"].rolling(50).mean() / df["close"] - 1
    df["ma200"]    = df["close"].rolling(200).mean() / df["close"] - 1
    df["vol10"]    = df["ret1"].rolling(10).std()
    df["vol20"]    = df["ret1"].rolling(20).std()
    df["mom10"]    = df["close"] / df["close"].shift(10) - 1
    df["mom20"]    = df["close"] / df["close"].shift(20) - 1
    df["rsi14"]    = rsi(df["close"], 14)
    df["rsi28"]    = rsi(df["close"], 28)

    macd_line, macd_sig, macd_hist = macd(df["close"])
    df["macd"]      = macd_line / df["close"]
    df["macd_sig"]  = macd_sig / df["close"]
    df["macd_hist"] = macd_hist / df["close"]

    upper, mid, lower = bollinger(df["close"])
    df["bb_pct"] = (df["close"] - lower) / (upper - lower).replace(0, np.nan)
    df["bb_width"] = (upper - lower) / mid

    df["atr14"] = atr_proxy(df["close"], 14) / df["close"]

    # Regime flags
    df["above_ma50"]  = (df["ma50"] < 0).astype(float)   # price > ma50 ⇒ ma50<0 after normalization
    df["above_ma200"] = (df["ma200"] < 0).astype(float)

    return df


FEATURE_COLUMNS = [
    "ret1", "ret5", "ret20",
    "ma10", "ma50", "ma200",
    "vol10", "vol20",
    "mom10", "mom20",
    "rsi14", "rsi28",
    "macd", "macd_sig", "macd_hist",
    "bb_pct", "bb_width",
    "atr14",
    "above_ma50", "above_ma200",
]


def feature_matrix(series: pd.Series) -> tuple[pd.DataFrame, list[str]]:
    """Return (clean X, column names) ready for sklearn."""
    df = build_features(series).dropna()
    return df[FEATURE_COLUMNS], FEATURE_COLUMNS


def build_features_ohlcv(ohlcv: pd.DataFrame) -> pd.DataFrame:
    """Extended feature set using high/low/volume in addition to close.

    Adds real ATR, OBV slope, volume z-score, close-to-high/low position.
    Falls back cleanly if volume is missing or constant.
    """
    if "close" not in ohlcv.columns:
        raise ValueError("ohlcv must contain a 'close' column")

    df = build_features(ohlcv["close"]).copy()

    if {"high", "low"}.issubset(ohlcv.columns):
        hl_range = (ohlcv["high"] - ohlcv["low"]).replace(0, np.nan)
        df["hl_range"] = (hl_range / ohlcv["close"]).fillna(0)
        df["close_pos"] = ((ohlcv["close"] - ohlcv["low"]) / hl_range).fillna(0.5).clip(0, 1)

        # True ATR — max of (H-L, |H-prev_close|, |L-prev_close|)
        prev_close = ohlcv["close"].shift(1)
        tr = pd.concat([
            ohlcv["high"] - ohlcv["low"],
            (ohlcv["high"] - prev_close).abs(),
            (ohlcv["low"] - prev_close).abs(),
        ], axis=1).max(axis=1)
        df["true_atr14"] = (tr.rolling(14).mean() / ohlcv["close"]).fillna(df.get("atr14", 0))
    else:
        df["hl_range"] = 0.0
        df["close_pos"] = 0.5
        df["true_atr14"] = df.get("atr14", 0)

    if "volume" in ohlcv.columns and ohlcv["volume"].std() > 0:
        vol = ohlcv["volume"].astype(float)
        mean20 = vol.rolling(20).mean()
        std20 = vol.rolling(20).std().replace(0, np.nan)
        df["vol_z"] = ((vol - mean20) / std20).fillna(0)

        # OBV slope (20-bar) normalized
        sign = np.sign(ohlcv["close"].diff()).fillna(0)
        obv = (sign * vol).cumsum()
        df["obv_slope"] = (obv.diff(20) / vol.rolling(20).mean().replace(0, np.nan)).fillna(0)
    else:
        df["vol_z"] = 0.0
        df["obv_slope"] = 0.0

    return df


EXTENDED_FEATURE_COLUMNS = FEATURE_COLUMNS + [
    "hl_range", "close_pos", "true_atr14", "vol_z", "obv_slope",
]


def feature_matrix_ohlcv(ohlcv: pd.DataFrame, macro: dict | None = None, sentiment: float | None = None) -> tuple[pd.DataFrame, list[str]]:
    """OHLCV feature matrix + optional macro / sentiment columns.

    macro is a dict like {"DGS10": 4.5, "VIXCLS": 15.2, "FEDFUNDS": 5.3} —
    broadcast as constant columns. sentiment is a scalar [-1, 1].
    """
    df = build_features_ohlcv(ohlcv).dropna()
    cols = list(EXTENDED_FEATURE_COLUMNS)
    if macro:
        for k, v in macro.items():
            col = f"macro_{k.lower()}"
            df[col] = float(v)
            cols.append(col)
    if sentiment is not None:
        df["sentiment"] = float(sentiment)
        cols.append("sentiment")
    return df[cols], cols


def garch_volatility_forecast(returns: pd.Series, horizon: int = 5) -> list[float]:
    """Simple GARCH(1,1) volatility forecast using arch_model — optional dep, fallback to EWMA."""
    try:
        from arch import arch_model
        r = returns.dropna() * 100
        am = arch_model(r, vol="Garch", p=1, q=1, rescale=False)
        res = am.fit(disp="off")
        fc = res.forecast(horizon=horizon, reindex=False)
        var = fc.variance.values[-1]
        return [float(np.sqrt(v) / 100) for v in var]
    except Exception:
        # EWMA fallback
        lam = 0.94
        r = returns.dropna().values
        if len(r) < 2:
            return [0.01] * horizon
        var = float(np.var(r[-30:]) if len(r) >= 30 else np.var(r))
        out = []
        for _ in range(horizon):
            var = lam * var + (1 - lam) * (r[-1] ** 2)
            out.append(float(np.sqrt(var)))
        return out
