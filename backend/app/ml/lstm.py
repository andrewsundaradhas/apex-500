"""PyTorch LSTM forecaster. Small model, trains quickly on CPU per request."""
from __future__ import annotations

import logging
from typing import Dict, List

import numpy as np
import pandas as pd
import torch
from torch import nn

log = logging.getLogger("apex.ml.lstm")

# Reproducibility
torch.manual_seed(42)
np.random.seed(42)


class LSTMForecaster(nn.Module):
    def __init__(self, hidden: int = 32, layers: int = 2):
        super().__init__()
        self.lstm = nn.LSTM(input_size=1, hidden_size=hidden, num_layers=layers, batch_first=True, dropout=0.1)
        self.head = nn.Sequential(nn.Linear(hidden, 16), nn.ReLU(), nn.Linear(16, 1))

    def forward(self, x):  # x: (B, T, 1)
        out, _ = self.lstm(x)
        return self.head(out[:, -1, :])  # (B, 1)


def _make_windows(series: np.ndarray, window: int = 30):
    """Create (X, y) windowed training data."""
    xs, ys = [], []
    for i in range(len(series) - window - 1):
        xs.append(series[i:i + window])
        ys.append(series[i + window])
    return np.array(xs), np.array(ys)


def lstm_forecast(series: pd.Series, horizon: int = 5, epochs: int = 30, window: int = 30) -> Dict:
    """Train a small LSTM on the series, forecast `horizon` steps ahead.

    Returns dict with `forecast`, `confidence`, `model`, `train_loss`.
    """
    data = series.dropna().astype(float).values
    if len(data) < window + 20:
        # Not enough data — degenerate fallback
        slope = (data[-1] - data[0]) / max(len(data), 1)
        forecast = [float(data[-1] + slope * (i + 1)) for i in range(horizon)]
        return {
            "forecast": forecast,
            "confidence": 0.55,
            "model": "LSTM-fallback",
            "train_loss": None,
        }

    # Normalize — LSTMs hate large inputs
    mean, std = float(data.mean()), float(data.std())
    if std < 1e-6: std = 1.0
    scaled = (data - mean) / std

    X, y = _make_windows(scaled, window=window)
    split = int(len(X) * 0.85)
    X_tr, y_tr = X[:split], y[:split]
    X_val, y_val = X[split:], y[split:]

    X_tr_t = torch.tensor(X_tr, dtype=torch.float32).unsqueeze(-1)
    y_tr_t = torch.tensor(y_tr, dtype=torch.float32).unsqueeze(-1)
    X_val_t = torch.tensor(X_val, dtype=torch.float32).unsqueeze(-1)
    y_val_t = torch.tensor(y_val, dtype=torch.float32).unsqueeze(-1)

    model = LSTMForecaster(hidden=32, layers=2)
    opt = torch.optim.Adam(model.parameters(), lr=3e-3)
    loss_fn = nn.SmoothL1Loss()

    model.train()
    for ep in range(epochs):
        opt.zero_grad()
        out = model(X_tr_t)
        loss = loss_fn(out, y_tr_t)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()

    # Validation loss for confidence calibration
    model.eval()
    with torch.no_grad():
        val_out = model(X_val_t) if len(X_val_t) else out
        val_loss = float(loss_fn(val_out, y_val_t).item()) if len(X_val_t) else float(loss.item())

    # Rolling forecast — feed last window, predict next, slide window
    window_data = scaled[-window:].tolist()
    forecasts_scaled: List[float] = []
    model.eval()
    with torch.no_grad():
        for _ in range(horizon):
            x = torch.tensor(window_data[-window:], dtype=torch.float32).view(1, window, 1)
            nxt = float(model(x).item())
            forecasts_scaled.append(nxt)
            window_data.append(nxt)

    forecast = [float(f * std + mean) for f in forecasts_scaled]

    # Confidence = 1 - scaled validation error (clamped)
    conf_raw = 1.0 - min(val_loss * 2, 0.5)
    confidence = float(max(0.58, min(0.88, conf_raw)))

    return {
        "forecast": forecast,
        "confidence": round(confidence, 3),
        "model": "LSTM v4.1",
        "train_loss": round(float(loss.item()), 4),
        "val_loss": round(val_loss, 4),
    }
