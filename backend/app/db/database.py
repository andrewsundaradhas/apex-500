"""SQLite database setup. Uses raw sqlite3 to keep the app lean — no ORM overhead."""
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "apex.db"
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
        """)

    # Seed a demo user so the frontend works out-of-the-box
    with cursor() as c:
        existing = c.execute("SELECT id FROM users WHERE email = ?", ("demo@apex500.dev",)).fetchone()
        if not existing:
            import bcrypt
            pw = bcrypt.hashpw(b"demo", bcrypt.gensalt(rounds=4)).decode()
            c.execute(
                "INSERT INTO users (email, password_hash, name, firm) VALUES (?, ?, ?, ?)",
                ("demo@apex500.dev", pw, "Jamie Ryder", "Lighthouse Capital"),
            )
            uid = c.lastrowid
            for t in ["SPX", "NDX", "DJI", "VIX", "AAPL", "NVDA", "MSFT", "GOOGL", "TSLA", "META"]:
                c.execute("INSERT OR IGNORE INTO watchlist (user_id, ticker) VALUES (?, ?)", (uid, t))
