"""WebSocket for live streaming quotes.

Polls the real quote source every N seconds (default 15s — tune via
`APEX_WS_POLL`). Between polls, simulates tick-level drift around the last
real price so the UI tape never feels frozen but isn't fabricating trends.
"""
import asyncio
import json
import logging
import os
import random
from typing import Dict, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..market import get_quote

router = APIRouter(tags=["ws"])
log = logging.getLogger("apex.ws")

POLL_SECONDS = int(os.environ.get("APEX_WS_POLL", "15"))
TICK_SECONDS = float(os.environ.get("APEX_WS_TICK", "1.0"))


@router.websocket("/ws/quotes")
async def ws_quotes(ws: WebSocket):
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

    mids: Dict[str, float] = {}

    def refresh_mids():
        for t in tickers:
            try:
                mids[t] = get_quote(t)["price"]
            except Exception:
                mids.setdefault(t, 100.0)

    await asyncio.to_thread(refresh_mids)

    try:
        loop = asyncio.get_event_loop()
        last_poll = loop.time()
        while True:
            now = loop.time()
            if now - last_poll >= POLL_SECONDS:
                await asyncio.to_thread(refresh_mids)
                last_poll = now

            payload = []
            for t in tickers:
                base = mids.get(t, 100.0)
                drift = random.gauss(0, 0.0004) * base
                mids[t] = base + drift
                payload.append({
                    "ticker": t,
                    "price": round(mids[t], 2),
                    "delta": round(drift, 3),
                    "ts": now,
                })
            await ws.send_text(json.dumps({"type": "tick", "quotes": payload}))
            await asyncio.sleep(TICK_SECONDS)
    except WebSocketDisconnect:
        log.info("ws client disconnected")
    except Exception as e:
        log.warning("ws error: %s", e)
