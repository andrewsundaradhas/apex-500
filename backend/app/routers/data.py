"""Meta-data endpoints: S&P 500 constituents, macro indicators, news, sentiment."""
from typing import Optional

from fastapi import APIRouter, Query

from ..services import macro, news, sp500

router = APIRouter(prefix="/api/data", tags=["data"])


@router.get("/sp500")
def sp500_list(sector: Optional[str] = None, limit: int = Query(500, ge=1, le=600)):
    sp500.ensure_sp500_seeded()
    return {"constituents": sp500.list_constituents(sector=sector, limit=limit)}


@router.get("/sp500/sectors")
def sp500_sectors():
    sp500.ensure_sp500_seeded()
    from ..db.database import cursor
    with cursor() as c:
        rows = c.execute("SELECT sector, COUNT(*) AS n FROM sp500_constituents GROUP BY sector ORDER BY n DESC").fetchall()
    return {"sectors": [{"sector": r["sector"], "count": r["n"]} for r in rows]}


@router.get("/macro")
def macro_snapshot():
    return macro.snapshot()


@router.get("/macro/{series_id}")
def macro_series(series_id: str, limit: int = 60):
    return {"series_id": series_id, "rows": macro.fetch_series(series_id, limit=limit)}


@router.get("/news")
def get_news(ticker: Optional[str] = None, limit: int = 10):
    return {"items": news.fetch_news(ticker, limit=limit)}


@router.get("/sentiment")
def get_sentiment(ticker: Optional[str] = None):
    # Ensure we have something cached
    news.fetch_news(ticker, limit=10)
    return news.aggregate_sentiment(ticker)
