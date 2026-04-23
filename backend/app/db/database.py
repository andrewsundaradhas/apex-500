"""SQLite database setup. Uses raw sqlite3 to keep the app lean — no ORM overhead."""
import sqlite3
from contextlib import contextmanager
from pathlib import Path

import os


def _resolve_db_path() -> Path:
    # Allow Fly.io or other deployments to mount a persistent volume and point
    # the DB there (e.g. /data/apex.db). Defaults keep local dev unchanged.
    explicit = os.environ.get("APEX_DB_PATH", "").strip()
    if explicit:
        return Path(explicit)
    data_dir = os.environ.get("APEX_DATA_DIR", "").strip()
    if data_dir:
        return Path(data_dir) / "apex.db"
    return Path(__file__).resolve().parent.parent.parent / "data" / "apex.db"


DB_PATH = _resolve_db_path()
DB_PATH.parent.mkdir(exist_ok=True)


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def cursor():
    conn = get_conn()
    try:
        cur = conn.cursor()
        yield cur
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with cursor() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            firm TEXT,
            risk_profile TEXT DEFAULT 'moderate',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS watchlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ticker TEXT NOT NULL,
            starred INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, ticker),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS market_data (
            ticker TEXT NOT NULL,
            date TEXT NOT NULL,
            open REAL, high REAL, low REAL, close REAL, volume INTEGER,
            PRIMARY KEY (ticker, date)
        );

        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT NOT NULL,
            horizon TEXT NOT NULL,
            model TEXT NOT NULL,
            target REAL NOT NULL,
            delta_pct REAL NOT NULL,
            confidence REAL NOT NULL,
            series_json TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_pred_ticker ON predictions(ticker, horizon, created_at);

        CREATE TABLE IF NOT EXISTS insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tone TEXT, category TEXT, title TEXT, body TEXT, meta TEXT,
            signals_json TEXT, time_label TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ticker TEXT NOT NULL,
            condition_type TEXT NOT NULL,   -- 'price_above' | 'price_below' | 'pct_change' | 'vix_above' | 'prediction_change'
            threshold REAL NOT NULL,
            note TEXT,
            enabled INTEGER DEFAULT 1,
            triggered_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id, enabled);

        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT,
            headline TEXT NOT NULL,
            source TEXT,
            url TEXT,
            sentiment REAL,          -- -1 (bearish) .. +1 (bullish)
            tone TEXT,               -- 'pos' | 'neg' | 'ai'
            published_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at DESC);

        CREATE TABLE IF NOT EXISTS macro_indicators (
            series_id TEXT NOT NULL,   -- e.g. 'FEDFUNDS', 'CPIAUCSL', 'GDP', 'UNRATE'
            date TEXT NOT NULL,
            value REAL,
            PRIMARY KEY (series_id, date)
        );

        CREATE TABLE IF NOT EXISTS sp500_constituents (
            ticker TEXT PRIMARY KEY,
            name TEXT,
            sector TEXT,
            sub_industry TEXT,
            added_date TEXT,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS model_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT NOT NULL,
            model TEXT NOT NULL,
            horizon TEXT NOT NULL,
            mae REAL, rmse REAL, hit_rate REAL, sharpe REAL,
            n_folds INTEGER,
            payload_json TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_model_runs ON model_runs(ticker, model, horizon, created_at);

        CREATE TABLE IF NOT EXISTS user_preferences (
            user_id INTEGER PRIMARY KEY,
            risk_profile TEXT DEFAULT 'moderate',
            theme TEXT DEFAULT 'dark',
            default_horizon TEXT DEFAULT '5d',
            notifications_email INTEGER DEFAULT 1,
            notifications_push INTEGER DEFAULT 1,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        """)

    # Record schema version so future Alembic-style migrations have a base.
    with cursor() as c:
        c.execute("INSERT OR IGNORE INTO schema_version (version) VALUES (1)")

    _ensure_prediction_accuracy_columns()
    _seed_demo_user()


def _column_names(table: str) -> set[str]:
    with cursor() as c:
        cols = c.execute(f"PRAGMA table_info({table})").fetchall()
    return {str(r["name"]) for r in cols}


def _ensure_prediction_accuracy_columns() -> None:
    """Lightweight schema evolution without a full migration framework."""
    cols = _column_names("predictions")
    alters: list[str] = []
    if "actual" not in cols:
        alters.append("ALTER TABLE predictions ADD COLUMN actual REAL")
    if "actual_delta_pct" not in cols:
        alters.append("ALTER TABLE predictions ADD COLUMN actual_delta_pct REAL")
    if "error_pct" not in cols:
        alters.append("ALTER TABLE predictions ADD COLUMN error_pct REAL")
    if "resolved_at" not in cols:
        alters.append("ALTER TABLE predictions ADD COLUMN resolved_at TEXT")
    if not alters:
        return
    with cursor() as c:
        for sql in alters:
            c.execute(sql)


def _seed_demo_user() -> None:
    """Seed a demo user so the frontend works out-of-the-box in dev.

    Skipped entirely in production unless `APEX_DEMO_USER=1` — public instances
    shouldn't ship with a known-password account. When enabled in production,
    the password comes from `APEX_DEMO_PASSWORD` (no default).
    """
    import os
    env = os.environ.get("APEX_ENV", "development").lower()
    if env == "production" and os.environ.get("APEX_DEMO_USER", "0") != "1":
        return

    demo_pw = os.environ.get("APEX_DEMO_PASSWORD", "demo")
    if env == "production" and demo_pw == "demo":
        # Refuse to seed a public instance with the documented default password.
        return

    with cursor() as c:
        existing = c.execute("SELECT id FROM users WHERE email = ?", ("demo@apex500.dev",)).fetchone()
        if existing:
            return
        import bcrypt
        rounds = int(os.environ.get("APEX_BCRYPT_ROUNDS", "12"))
        pw = bcrypt.hashpw(demo_pw.encode()[:72], bcrypt.gensalt(rounds=rounds)).decode()
        c.execute(
            "INSERT INTO users (email, password_hash, name, firm) VALUES (?, ?, ?, ?)",
            ("demo@apex500.dev", pw, "Jamie Ryder", "Lighthouse Capital"),
        )
        uid = c.lastrowid
        for t in ["SPX", "NDX", "DJI", "VIX", "AAPL", "NVDA", "MSFT", "GOOGL", "TSLA", "META"]:
            c.execute("INSERT OR IGNORE INTO watchlist (user_id, ticker) VALUES (?, ?)", (uid, t))


def prune_old_predictions(keep_per_ticker: int = 500) -> int:
    """Trim the predictions table — keep the newest N rows per ticker."""
    with cursor() as c:
        deleted = c.execute("""
            DELETE FROM predictions
            WHERE id IN (
                SELECT id FROM predictions p
                WHERE (
                    SELECT COUNT(*) FROM predictions q
                    WHERE q.ticker = p.ticker AND q.id > p.id
                ) >= ?
            )
        """, (keep_per_ticker,)).rowcount
    return deleted or 0
