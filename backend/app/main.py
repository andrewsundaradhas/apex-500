"""Apex 500 FastAPI app entry point."""
import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .db.database import init_db, prune_old_predictions
from .routers import alerts, auth, backtest, data, insights, market, metrics, predict, system, watchlist, ws
from .services import macro, news, sp500
from .scheduler import build_scheduler, refresh_hot_predictions
from .logging_config import setup_logging, log_system_info
from .monitoring import monitor, monitor_performance

# Setup enhanced logging
setup_logging()
log = logging.getLogger("apex")

limiter = Limiter(key_func=get_remote_address, default_limits=[os.environ.get("APEX_RATE_LIMIT", "120/minute")])

app = FastAPI(title="Apex 500 API", version="0.3.0")
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded", "limit": str(exc.detail)})


cors_origins = os.environ.get("APEX_CORS_ORIGINS", "*").split(",")
env = os.environ.get("APEX_ENV", "development").lower()
if env == "production" and "*" in [o.strip() for o in cors_origins]:
    log.warning("APEX_CORS_ORIGINS is '*' in production — tighten this for a public deploy.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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

scheduler = build_scheduler()


@app.on_event("startup")
@monitor_performance
def on_startup():
    log_system_info()
    
    init_db()
    log.info("DB initialized")

    try:
        deleted = prune_old_predictions(keep_per_ticker=500)
        if deleted:
            log.info("Pruned %d old predictions", deleted)
    except Exception as e:
        log.warning("prune failed: %s", e)

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
        from .services import news
        news.fetch_news(limit=12)
        log.info("news seeded")
    except Exception as e:
        log.warning("news seeding failed: %s", e)

    try:
        scheduler.start()
        log.info("scheduler started")
        # Warm once at boot so the first user doesn't pay the cold-start cost.
        refresh_hot_predictions()
    except Exception as e:
        log.warning("scheduler start failed: %s", e)

    log.info("Apex 500 API ready with enhanced monitoring")


@app.on_event("shutdown")
def on_shutdown():
    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
    except Exception:
        pass


@app.get("/")
def root():
    return {
        "service": "Apex 500 API",
        "version": app.version,
        "endpoints": {
            "health":     "/health",
            "monitoring": "/monitoring",
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

@app.get("/health")
@monitor_performance
def health_check():
    """Enhanced health check endpoint."""
    return monitor.health_check()

@app.get("/monitoring")
@monitor_performance
def monitoring_dashboard():
    """Detailed monitoring metrics."""
    from datetime import datetime
    return {
        "system": monitor.get_system_metrics(),
        "database": monitor.get_database_metrics(),
        "api": monitor.get_api_metrics(),
        "timestamp": datetime.utcnow().isoformat()
    }
