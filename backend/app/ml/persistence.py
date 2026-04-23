"""Model caching. LSTM/Transformer are fast enough to retrain per request, but classical
models (RF, GB) and their scalers benefit from disk caching. Keyed by (ticker, model, horizon)."""
from __future__ import annotations

import hashlib
import os
import pickle
import time
from pathlib import Path
from typing import Any, Optional

def _resolve_cache_dir() -> Path:
    explicit = os.environ.get("APEX_MODELS_DIR", "").strip()
    if explicit:
        return Path(explicit)
    data_dir = os.environ.get("APEX_DATA_DIR", "").strip()
    if data_dir:
        return Path(data_dir) / "models_cache"
    return Path(__file__).resolve().parent.parent.parent / "models_cache"


CACHE_DIR = _resolve_cache_dir()
CACHE_DIR.mkdir(exist_ok=True)
DEFAULT_TTL_SECONDS = 3600 * 6  # 6 hours


def _key(ticker: str, model: str, horizon: int | str) -> Path:
    raw = f"{ticker.upper()}:{model}:{horizon}".encode()
    h = hashlib.md5(raw).hexdigest()[:12]
    return CACHE_DIR / f"{h}.pkl"


def load(ticker: str, model: str, horizon: int | str, ttl: int = DEFAULT_TTL_SECONDS) -> Optional[Any]:
    p = _key(ticker, model, horizon)
    if not p.exists():
        return None
    if time.time() - p.stat().st_mtime > ttl:
        return None
    try:
        with p.open("rb") as f:
            return pickle.load(f)
    except Exception:
        return None


def save(ticker: str, model: str, horizon: int | str, obj: Any) -> None:
    p = _key(ticker, model, horizon)
    try:
        with p.open("wb") as f:
            pickle.dump(obj, f)
    except Exception:
        pass


def clear() -> int:
    n = 0
    for p in CACHE_DIR.glob("*.pkl"):
        p.unlink(missing_ok=True); n += 1
    return n
