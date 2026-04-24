"""Enhanced logging configuration for Apex 500 backend."""
import logging
import logging.handlers
import os
import sys
from datetime import datetime
from pathlib import Path

def setup_logging():
    """Configure structured logging with file rotation and monitoring."""
    
    # Create logs directory
    log_dir = Path(__file__).parent.parent.parent / "logs"
    log_dir.mkdir(exist_ok=True)
    
    # Log level based on environment
    env = os.environ.get("APEX_ENV", "development").lower()
    log_level = logging.DEBUG if env == "development" else logging.INFO
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        fmt="%(asctime)s.%(msecs)03d %(levelname)s [%(name)s] %(funcName)s:%(lineno)d - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    simple_formatter = logging.Formatter(
        fmt="%(asctime)s %(levelname)s [%(name)s] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Clear existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler with rotation
    log_file = log_dir / f"apex_{datetime.now().strftime('%Y%m%d')}.log"
    file_handler = logging.handlers.RotatingFileHandler(
        log_file, maxBytes=50*1024*1024, backupCount=5, encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(file_handler)
    
    # Error file handler
    error_log_file = log_dir / f"apex_errors_{datetime.now().strftime('%Y%m%d')}.log"
    error_handler = logging.handlers.RotatingFileHandler(
        error_log_file, maxBytes=10*1024*1024, backupCount=3, encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(detailed_formatter)
    root_logger.addHandler(error_handler)
    
    # Suppress noisy third-party logs
    logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("yfinance").setLevel(logging.WARNING)
    
    # Application-specific loggers
    app_loggers = [
        "apex",
        "apex.auth",
        "apex.market", 
        "apex.ml",
        "apex.scheduler",
        "apex.services",
        "apex.ws"
    ]
    
    for logger_name in app_loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(log_level)
    
    return root_logger

def log_system_info():
    """Log system information for monitoring."""
    import platform
    import psutil
    
    logger = logging.getLogger("apex.system")
    logger.info("=== Apex 500 Backend Starting ===")
    logger.info(f"Python: {platform.python_version()}")
    logger.info(f"Platform: {platform.platform()}")
    logger.info(f"CPU Count: {psutil.cpu_count()}")
    logger.info(f"Memory: {psutil.virtual_memory().total / (1024**3):.1f} GB")
    logger.info(f"Environment: {os.environ.get('APEX_ENV', 'development')}")
    logger.info(f"API Keys Configured: Finnhub={'✓' if os.environ.get('APEX_FINNHUB_KEY') else '✗'}, FRED={'✓' if os.environ.get('APEX_FRED_API_KEY') else '✗'}")

def log_api_usage(source: str, ticker: str, success: bool, response_time: float = None):
    """Log API usage for monitoring."""
    logger = logging.getLogger("apex.api_monitor")
    status = "SUCCESS" if success else "FAILED"
    msg = f"API_CALL: {source} | {ticker} | {status}"
    if response_time:
        msg += f" | {response_time:.2f}s"
    logger.info(msg)

def log_model_performance(model: str, ticker: str, horizon: str, metrics: dict):
    """Log ML model performance metrics."""
    logger = logging.getLogger("apex.ml_performance")
    logger.info(f"MODEL_PERFORMANCE: {model} | {ticker} | {horizon} | MAE:{metrics.get('mae', 'N/A'):.4f} | RMSE:{metrics.get('rmse', 'N/A'):.4f} | HitRate:{metrics.get('hit_rate', 'N/A'):.2%}")

def log_user_activity(action: str, user_id: int = None, details: str = ""):
    """Log user activities for security monitoring."""
    logger = logging.getLogger("apex.security")
    user_info = f"User:{user_id}" if user_id else "User:anonymous"
    msg = f"USER_ACTIVITY: {action} | {user_info}"
    if details:
        msg += f" | {details}"
    logger.info(msg)
