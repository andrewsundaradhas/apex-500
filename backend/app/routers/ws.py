"""WebSocket for live streaming quotes. Simulates tick-level movement around the current mid."""
import asyncio
import json
import logging
import random
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..market import get_quote

router = APIRouter(tags=["ws"])
log = logging.getLogger("apex.ws")


@router.websocket("/ws/quotes")
async def ws_quotes(ws: WebSocket):
    """Stream quote updates every second for the tickers provided in the first message."""
    await ws.accept()
    tickers: List[str] = ["SPX", "NDX", "AAPL", "NVDA", "VIX"]

    try:
        init = await asyncio.wait_for(ws.receive_text(), timeout=2.0)
        try:
            msg = json.loads(init)
            if isinstance(msg.get("tickers"), list) and msg["tickers"]:
                tickers = [t.upper() for t in msg["tickers"]][:20]
        except Exception:
            pass
    except asyncio.TimeoutError:
        pass

    # Prime initial quotes
    base = {}
    for t in tickers:
        try:
            q = get_quote(t)
            base[t] = q["price"]
        except Exception:
            base[t] = 100.0

    try:
        while True:
            payload = []
            for t in tickers:
                # Random-walk around the current price — simulates tick stream.
                # In prod this would tail a real market-data feed.
                drift = random.gauss(0, 0.0006) * base[t]
                base[t] = base[t] + drift
                payload.append({
                    "ticker": t,
                    "price": round(base[t], 2),
                    "delta": round(drift, 3),
                    "ts": asyncio.get_event_loop().time(),
                })
            await ws.send_text(json.dumps({"type": "tick", "quotes": payload}))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        log.info("ws client disconnected")
    except Exception as e:
        log.warning("ws error: %s", e)
