"""Apex 500 FastAPI app entry point."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db.database import init_db
from .routers import alerts, auth, backtest, data, insights, market, metrics, predict, system, watchlist, ws
from .services import macro, news, sp500

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("apex")

app = FastAPI(title="Apex 500 API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routers
app.include_router(system.router)
app.include_router(auth.router)
app.include_router(market.router)
app.include_router(predict.router)
app.include_router(insights.router)
app.include_router(watchlist.router)

# Added in v0.2
app.include_router(backtest.router)
app.include_router(metrics.router)
app.include_router(alerts.router)
app.include_router(data.router)
app.include_router(ws.router)


@app.on_event("startup")
def on_startup():
    init_db()
    log.info("DB initialized")

    # Seed static datasets (cheap, cached after first run)
    try:
        n = sp500.ensure_sp500_seeded()
        log.info("sp500_constituents: %d rows", n)
    except Exception as e:
        log.warning("sp500 seeding failed: %s", e)

    try:
        macro.ensure_seeded()
        log.info("macro_indicators seeded")
    except Exception as e:
        log.warning("macro seeding failed: %s", e)

    try:
        news.fetch_news(limit=12)
        log.info("news seeded")
    except Exception as e:
        log.warning("news seeding failed: %s", e)

    log.info("Apex 500 API v0.2.0 ready")


@app.get("/")
def root():
    return {
        "service": "Apex 500 API",
        "version": "0.2.0",
        "endpoints": {
            "health":     "/health",
            "market":     "/api/market/{quote,history,sectors}",
            "predict":    "/api/predict/{ticker}?horizon=1d|5d|1m&model=arima|lstm|transformer|boost|ensemble",
            "backtest":   "/api/backtest/{ticker}?model=&horizon=&max_folds=",
            "metrics":    "/api/metrics/{models,summary,predictions}",
            "insights":   "/api/insights",
            "alerts":     "/api/alerts",
            "watchlist":  "/api/watchlist",
            "data":       "/api/data/{sp500,macro,news,sentiment}",
            "auth":       "/api/auth/{login,signup}",
            "export":     "/api/export/predictions.csv",
            "ws":         "/ws/quotes (WebSocket)",
            "docs":       "/docs",
        },
    }
