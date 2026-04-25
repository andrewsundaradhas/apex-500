"""Health monitoring and metrics for Apex 500 backend."""
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
from functools import wraps

import psutil
from .db.database import cursor

log = logging.getLogger("apex.monitoring")

class HealthMonitor:
    """System health monitoring and metrics collection."""
    
    def __init__(self):
        self.start_time = datetime.utcnow()
        self.api_calls = {}
        self.model_runs = {}
        self.error_count = 0
        
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system metrics."""
        return {
            "uptime_seconds": (datetime.utcnow() - self.start_time).total_seconds(),
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "memory_available_gb": psutil.virtual_memory().available / (1024**3),
            "disk_percent": psutil.disk_usage('/').percent if hasattr(psutil, 'disk_usage') else 0,
        }
    
    def get_database_metrics(self) -> Dict[str, Any]:
        """Get database statistics."""
        try:
            with cursor() as c:
                # User count
                user_count = c.execute("SELECT COUNT(*) as count FROM users").fetchone()["count"]
                
                # Prediction count
                pred_count = c.execute("SELECT COUNT(*) as count FROM predictions").fetchone()["count"]
                
                # Latest prediction
                latest = c.execute("SELECT MAX(created_at) as latest FROM predictions").fetchone()["latest"]
                
                # Database size (approximate)
                tables = ["users", "predictions", "market_data", "insights", "news", "macro_indicators"]
                table_counts = {}
                for table in tables:
                    try:
                        count = c.execute(f"SELECT COUNT(*) as count FROM {table}").fetchone()["count"]
                        table_counts[table] = count
                    except Exception:
                        table_counts[table] = 0
                
                return {
                    "user_count": user_count,
                    "prediction_count": pred_count,
                    "latest_prediction": latest,
                    "table_counts": table_counts,
                    "database_healthy": True
                }
        except Exception as e:
            log.error(f"Database metrics failed: {e}")
            return {"database_healthy": False, "error": str(e)}
    
    def get_api_metrics(self) -> Dict[str, Any]:
        """Get API usage metrics."""
        return {
            "total_api_calls": sum(self.api_calls.values()),
            "api_calls_by_source": dict(self.api_calls),
            "error_count": self.error_count,
            "model_runs": dict(self.model_runs)
        }
    
    def record_api_call(self, source: str, success: bool = True):
        """Record an API call for monitoring."""
        key = f"{source}_{'success' if success else 'failed'}"
        self.api_calls[key] = self.api_calls.get(key, 0) + 1
        if not success:
            self.error_count += 1
    
    def record_model_run(self, model: str, ticker: str):
        """Record a model execution."""
        key = f"{model}_{ticker}"
        self.model_runs[key] = self.model_runs.get(key, 0) + 1
    
    def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check."""
        system = self.get_system_metrics()
        database = self.get_database_metrics()
        api = self.get_api_metrics()
        
        # Determine overall health
        healthy = True
        issues = []
        
        if system["cpu_percent"] > 90:
            healthy = False
            issues.append("High CPU usage")
        
        if system["memory_percent"] > 90:
            healthy = False
            issues.append("High memory usage")
        
        if not database.get("database_healthy", False):
            healthy = False
            issues.append("Database connection issues")
        
        return {
            "status": "healthy" if healthy else "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime_seconds": system["uptime_seconds"],
            "issues": issues,
            "system": system,
            "database": database,
            "api": api
        }

# Global monitor instance
monitor = HealthMonitor()

def monitor_performance(func):
    """Decorator to monitor function performance."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            # Log performance if it's slow
            if execution_time > 5.0:  # Log if > 5 seconds
                log.warning(f"Slow function: {func.__name__} took {execution_time:.2f}s")
            
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            log.error(f"Function {func.__name__} failed after {execution_time:.2f}s: {e}")
            monitor.record_api_call(f"function_{func.__name__}", success=False)
            raise
    return wrapper

def get_recent_errors(limit: int = 50) -> List[Dict[str, Any]]:
    """Get recent error logs from the database."""
    try:
        with cursor() as c:
            # This would require an error_logs table, for now return empty
            # In a production setup, you'd store errors in a dedicated table
            return []
    except Exception as e:
        log.error(f"Failed to get recent errors: {e}")
        return []

def cleanup_old_metrics(days: int = 7):
    """Clean up old monitoring data."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    log.info(f"Cleaning up metrics older than {cutoff_date}")
    # Implementation would depend on what metrics we store in DB
