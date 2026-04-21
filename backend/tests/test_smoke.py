"""Smoke tests: every endpoint returns 2xx with expected structure.

Run: cd backend && python3 -m pytest tests/ -v
Or without pytest: python3 tests/test_smoke.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient

from app.main import app
from app.db.database import init_db
from app.services import sp500, macro, news as news_svc

# Force DB + seed data up front since TestClient at module scope can skip startup events
init_db()
try: sp500.ensure_sp500_seeded()
except Exception: pass
try: macro.ensure_seeded()
except Exception: pass
try: news_svc.fetch_news(limit=8)
except Exception: pass

client = TestClient(app)


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["service"] == "Apex 500 API"


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_market_quote():
    r = client.get("/api/market/quote/AAPL")
    assert r.status_code == 200
    d = r.json()
    assert d["ticker"] == "AAPL"
    assert isinstance(d["price"], (int, float))


def test_market_history():
    r = client.get("/api/market/history/SPX?timeframe=1M")
    assert r.status_code == 200
    d = r.json()
    assert len(d["close"]) > 0


def test_market_sectors():
    r = client.get("/api/market/sectors")
    assert r.status_code == 200
    assert len(r.json()["sectors"]) == 11


def test_predict_ensemble():
    r = client.get("/api/predict/SPX?horizon=5d&model=ensemble")
    assert r.status_code == 200
    d = r.json()
    assert d["model"] == "Ensemble"
    assert "target" in d
    assert 0 < d["confidence"] < 1
    assert len(d["metadata"]["component_models"]) == 4


def test_predict_each_model():
    for m in ("arima", "lstm", "transformer", "boost"):
        r = client.get(f"/api/predict/AAPL?horizon=5d&model={m}")
        assert r.status_code == 200, f"{m} failed: {r.text[:200]}"
        assert "target" in r.json()


def test_backtest():
    r = client.get("/api/backtest/SPX?model=arima&horizon=5&max_folds=8")
    assert r.status_code == 200
    d = r.json()
    assert d["n_folds"] >= 1
    assert 0 <= d["hit_rate"] <= 1


def test_insights():
    r = client.get("/api/insights")
    assert r.status_code == 200
    assert len(r.json()["items"]) >= 3


def test_watchlist_list():
    r = client.get("/api/watchlist")
    assert r.status_code == 200
    assert len(r.json()["items"]) > 0


def test_watchlist_add_remove():
    r = client.post("/api/watchlist", json={"ticker": "TEST"})
    assert r.status_code == 200
    r = client.delete("/api/watchlist/TEST")
    assert r.status_code == 200


def test_alerts_crud():
    r = client.post("/api/alerts", json={
        "ticker": "SPX", "condition_type": "price_above", "threshold": 6000, "note": "test"
    })
    assert r.status_code == 200
    aid = r.json()["id"]
    r = client.get("/api/alerts")
    assert any(a["id"] == aid for a in r.json()["items"])
    r = client.delete(f"/api/alerts/{aid}")
    assert r.status_code == 200


def test_alerts_evaluate():
    r = client.post("/api/alerts/evaluate")
    assert r.status_code == 200
    assert "checked" in r.json()


def test_data_sp500():
    r = client.get("/api/data/sp500?limit=10")
    assert r.status_code == 200
    assert len(r.json()["constituents"]) > 0


def test_data_sectors():
    r = client.get("/api/data/sp500/sectors")
    assert r.status_code == 200


def test_data_macro():
    r = client.get("/api/data/macro")
    assert r.status_code == 200


def test_data_news():
    r = client.get("/api/data/news")
    assert r.status_code == 200
    assert len(r.json()["items"]) > 0


def test_data_sentiment():
    r = client.get("/api/data/sentiment")
    assert r.status_code == 200
    assert "score" in r.json()


def test_metrics_summary():
    r = client.get("/api/metrics/summary")
    assert r.status_code == 200


def test_metrics_predictions():
    r = client.get("/api/metrics/predictions?limit=5")
    assert r.status_code == 200


def test_auth_signup_login():
    r = client.post("/api/auth/signup", json={
        "email": "test-smoke@apex500.dev", "password": "pw123", "name": "Smoke Test"
    })
    assert r.status_code in (200, 400)  # 400 if already exists
    r = client.post("/api/auth/login", json={
        "email": "demo@apex500.dev", "password": "demo"
    })
    assert r.status_code == 200
    assert "token" in r.json()


def test_export_csv():
    r = client.get("/api/export/predictions.csv")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")


if __name__ == "__main__":
    tests = [(name, fn) for name, fn in globals().items() if name.startswith("test_") and callable(fn)]
    passed, failed = 0, []
    for name, fn in tests:
        try:
            fn()
            print(f"  PASS  {name}")
            passed += 1
        except Exception as e:
            print(f"  FAIL  {name}: {e}")
            failed.append(name)
    print(f"\n{passed}/{len(tests)} passed")
    if failed:
        print("Failed:", ", ".join(failed))
        sys.exit(1)
