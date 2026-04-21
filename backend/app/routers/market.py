from fastapi import APIRouter, HTTPException, Query

from ..market import get_history, get_quote, get_sectors

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/quote/{ticker}")
def quote(ticker: str):
    return get_quote(ticker.upper())


@router.get("/history/{ticker}")
def history(ticker: str, timeframe: str = Query("1M")):
    df = get_history(ticker.upper(), timeframe)
    if df.empty:
        raise HTTPException(404, "No data")
    return {
        "ticker": ticker.upper(),
        "timeframe": timeframe,
        "close": [float(x) for x in df["close"].tolist()],
        "dates": [str(d) for d in df["date"].tolist()],
        "volume": [int(v) for v in df.get("volume", []).tolist()] if "volume" in df.columns else [],
        "n": len(df),
    }


@router.get("/sectors")
def sectors():
    return {"sectors": get_sectors()}
