"""Tiny in-memory TTL cache. Process-local; fine for single-worker uvicorn.

For multi-worker or multi-host deploys swap this for Redis via the same
get/set interface — callers don't need to change.
"""
from __future__ import annotations

import threading
import time
from typing import Any, Optional, Tuple

_store: dict[str, Tuple[float, Any]] = {}
_lock = threading.Lock()


def get(key: str) -> Optional[Any]:
    with _lock:
        entry = _store.get(key)
        if not entry:
            return None
        expires_at, value = entry
        if time.time() > expires_at:
            _store.pop(key, None)
            return None
        return value


def set(key: str, value: Any, ttl_seconds: int) -> None:
    with _lock:
        _store[key] = (time.time() + ttl_seconds, value)


def invalidate(prefix: str = "") -> int:
    with _lock:
        if not prefix:
            n = len(_store)
            _store.clear()
            return n
        keys = [k for k in _store if k.startswith(prefix)]
        for k in keys:
            _store.pop(k, None)
        return len(keys)


def stats() -> dict:
    with _lock:
        now = time.time()
        alive = sum(1 for exp, _ in _store.values() if exp > now)
        return {"total": len(_store), "alive": alive}
