# Apex 500

AI-powered S&P 500 forecasting platform — complete full-stack app with a React + Three.js frontend and a Python FastAPI backend powered by PyTorch LSTM, PyTorch Transformer, GradientBoost, ARIMA, and a confidence-weighted ensemble.

---

## What's in the box

### Frontend (React + Vite + Three.js + React Router)
- **Marketing landing** (`/`) — 3D Three.js hero (data-wave surface, orbiting particles, neural-net lattice, mouse parallax)
- **Dashboard** (`/dashboard`) — live SPX chart with AI forecast overlay, 3 prediction cards, sector heatmap, 30-day correlation matrix, what-if scenario sliders, insight panel, sentiment meter, watchlist widget, news ticker, live tape
- **Predictions** (`/predictions`) — filterable prediction table, model performance cards
- **Prediction Detail** (`/predictions/:id`) — fan chart + 95% CI band, model breakdown, signal panel, **walk-forward backtest** panel, AI narrative
- **Insights** (`/insights`) — category-filtered insights, anomaly scanner, expandable cards
- **Watchlist** (`/watchlist`) — sortable table + grid view with AI buy/sell signals
- **Settings** (`/settings`) — Account, API keys, Models, Alerts, Billing, Team, Security, Appearance
- **Onboarding** (`/login`) — sign-in + 2-step signup
- Command palette (⌘K / Ctrl+K) on every app page
- Live WebSocket ticker tape on every app page

### Backend (FastAPI + SQLite + PyTorch + scikit-learn + statsmodels + yfinance)
- **Core routers**: `auth`, `market`, `predict`, `insights`, `watchlist`
- **ML routers**: `backtest`, `metrics`
- **Data routers**: `data` (S&P 500 constituents, macro, news, sentiment), `alerts`
- **System**: `health`, CSV export, WebSocket `/ws/quotes`

### ML pipeline (all real, CPU-only, ~1s per model)
| Model | Implementation | Type |
|---|---|---|
| **ARIMA(1,1,1)** | `statsmodels` | Classical time-series |
| **Random Forest** | `sklearn` | Directional classifier (Buy/Sell/Hold) |
| **GradientBoost** | `sklearn` GBRegressor | Return regressor w/ feature importance |
| **LSTM v4.1** | PyTorch, 2-layer, 32 hidden | Deep learning — sequential |
| **Transformer-L** | PyTorch, 2-layer encoder, 4-head attention | Deep learning — attention-based |
| **Ensemble** | Confidence-weighted blend | Combines all 4 + RF nudge + GARCH CI band |
| **GARCH(1,1)** | `arch` (optional) / EWMA | Volatility forecasting |

**Feature engineering** (`backend/app/ml/features.py`): 20 technical indicators — returns over 1/5/20 days, MAs over 10/50/200, vol over 10/20, momentum 10/20, RSI 14/28, MACD (line/signal/histogram), Bollinger bands (%B + width), ATR proxy, regime flags.

**Backtesting** (`backend/app/ml/backtest.py`): walk-forward CV, reports MAE, RMSE, MAPE, directional hit-rate, Sharpe of a long-on-up strategy.

### Database (SQLite)
`users`, `watchlist`, `market_data`, `predictions`, `insights`, `alerts`, `news`, `macro_indicators`, `sp500_constituents`, `model_runs`, `user_preferences`

### Datasets
- **Market data**: yfinance (Yahoo Finance) for real OHLCV, with deterministic mock fallback
- **S&P 500 constituents**: scraped from Wikipedia, with a 60-stock static fallback
- **Macro indicators** (FRED, no API key): `FEDFUNDS`, `CPIAUCSL`, `UNRATE`, `GDP`, `DGS10`, `VIXCLS`
- **News**: yfinance ticker news + lexicon-based sentiment (60-word polarity dictionary)

---

## Running it

### Prerequisites
- Node.js 18+
- Python 3.11+
- pip

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend (from repo root)
pip install -r backend/requirements.txt
# On macOS/Linux you may need --break-system-packages if outside a venv.
# Recommended: use a virtualenv:
#   python3 -m venv .venv && source .venv/bin/activate
#   pip install -r backend/requirements.txt
```

### 2. Start the backend

```bash
cd backend
python3 -m uvicorn app.main:app --reload --port 8000
```

Backend will:
- Create `backend/data/apex.db` with all tables
- Seed a demo user (`demo@apex500.dev` / `demo`) with a watchlist
- Seed S&P 500 constituents (from Wikipedia, fallback to 60 names)
- Seed FRED macro indicators (with offline fallback)
- Seed news + sentiment

Visit http://localhost:8000/docs for interactive API docs.

### 3. Start the frontend

```bash
# From repo root
npm run dev
```



## API cheat sheet

```
GET  /health                                    — liveness + uptime + DB + torch version
GET  /                                          — list of endpoints

# Market
GET  /api/market/quote/{ticker}                 — current quote
GET  /api/market/history/{ticker}?timeframe=1M  — OHLCV (1D|1W|1M|1Y|5Y)
GET  /api/market/sectors                        — SPDR sector performance

# Predictions (the ML)
GET  /api/predict/{ticker}?horizon=5d&model=ensemble
  model:   arima | lstm | transformer | boost | ensemble
  horizon: 1d | 5d | 1m

# Backtesting
GET  /api/backtest/{ticker}?model=arima&horizon=5&max_folds=20

# Insights & sentiment
GET  /api/insights                              — AI-generated market narratives
GET  /api/data/sentiment?ticker=SPX             — aggregate sentiment from news

# Watchlist
GET/POST/DELETE /api/watchlist                  — list/add/remove

# Alerts
GET/POST/PATCH/DELETE /api/alerts
POST /api/alerts/evaluate                       — check firing alerts

# Reference data
GET  /api/data/sp500                            — 500 constituents w/ sector
GET  /api/data/sp500/sectors                    — sector counts
GET  /api/data/macro                            — all FRED series snapshot
GET  /api/data/macro/{series_id}                — one FRED series
GET  /api/data/news?ticker=AAPL                 — news + sentiment tones

# Metrics
GET  /api/metrics/summary                       — aggregate model performance
GET  /api/metrics/models?ticker=SPX             — model_runs history
GET  /api/metrics/predictions?ticker=SPX        — prediction log

# Auth
POST /api/auth/login  { email, password }
POST /api/auth/signup { email, password, name }

# Export
GET  /api/export/predictions.csv?ticker=SPX
GET  /api/export/watchlist.csv

# Real-time
WS   /ws/quotes                                 — live streaming quotes (send { tickers: [...] } on connect)
```

---

## Project layout

```
apex-500/
├── index.html                    # Vite entry
├── package.json                  # Frontend deps
├── vite.config.js
├── README.md                     # This file
├── src/                          # Frontend source
│   ├── main.jsx
│   ├── App.jsx                   # React Router
│   ├── api/client.js             # API + WebSocket client
│   ├── lib/hooks.js
│   ├── styles/
│   │   ├── tokens.css            # Design tokens (colors, type, spacing)
│   │   └── global.css
│   ├── components/
│   │   ├── Icon.jsx
│   │   ├── primitives.jsx        # Button, Pill, Card, CardHead, MetricCell
│   │   ├── Sidebar.jsx
│   │   ├── TopBar.jsx
│   │   ├── CommandPalette.jsx    # ⌘K
│   │   ├── LiveTape.jsx          # WebSocket ticker tape
│   │   ├── BacktestPanel.jsx     # Walk-forward backtest UI
│   │   ├── ThreeHero.jsx         # Three.js 3D landing hero
│   │   └── dashboard/            # Dashboard widgets
│   │       ├── HeroChart.jsx
│   │       ├── PredictionCards.jsx
│   │       ├── SectorHeatmap.jsx
│   │       ├── CorrelationMatrix.jsx
│   │       ├── WhatIfPanel.jsx
│   │       ├── InsightPanel.jsx
│   │       ├── SentimentMeter.jsx
│   │       ├── WatchlistWidget.jsx
│   │       └── NewsTicker.jsx
│   └── pages/
│       ├── Marketing.jsx         # /
│       ├── Onboarding.jsx        # /login
│       ├── AppShell.jsx          # App-chrome wrapper (sidebar + topbar)
│       ├── Dashboard.jsx         # /dashboard
│       ├── Predictions.jsx       # /predictions
│       ├── PredictionDetail.jsx  # /predictions/:id
│       ├── Insights.jsx          # /insights
│       ├── Watchlist.jsx         # /watchlist
│       └── Settings.jsx          # /settings
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py               # FastAPI entry
│   │   ├── market.py             # yfinance + mock fallback
│   │   ├── auth_deps.py          # JWT dependency
│   │   ├── db/database.py        # SQLite schema + seed
│   │   ├── ml/
│   │   │   ├── features.py       # Shared feature engineering + GARCH
│   │   │   ├── classical.py      # ARIMA + Random Forest
│   │   │   ├── lstm.py           # PyTorch LSTM
│   │   │   ├── transformer.py    # PyTorch Transformer
│   │   │   ├── boost.py          # GradientBoost regressor
│   │   │   ├── ensemble.py       # Confidence-weighted blend
│   │   │   ├── backtest.py       # Walk-forward CV
│   │   │   └── persistence.py    # Model pickle cache
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── market.py
│   │   │   ├── predict.py
│   │   │   ├── backtest.py
│   │   │   ├── insights.py
│   │   │   ├── watchlist.py
│   │   │   ├── alerts.py
│   │   │   ├── data.py           # S&P 500, macro, news, sentiment
│   │   │   ├── metrics.py
│   │   │   ├── ws.py             # WebSocket live quotes
│   │   │   └── system.py         # /health + CSV export
│   │   └── services/
│   │       ├── sp500.py          # Wikipedia constituents scraper
│   │       ├── macro.py          # FRED loader
│   │       └── news.py           # yfinance news + sentiment
│   ├── tests/
│   │   └── test_smoke.py         # 22 endpoint smoke tests
│   ├── data/                     # SQLite DB (generated)
│   └── models_cache/             # Pickled classical models (generated)
└── project/                      # Original design prototypes (reference)
    ├── colors_and_type.css
    ├── preview/                  # 19 token/component preview cards
    └── ui_kits/                  # HTML prototypes per page
```

---

## Notes on the "best datasets" choice

Every dataset is free and needs no API key:

- **yfinance** for prices — most complete free tick source, covers every US stock, every major index, futures, options chains, FX, crypto. Used by quant blogs and millions of retail traders.
- **Wikipedia S&P 500 list** — the canonical up-to-date constituents list; no corporate API needed.
- **FRED (St. Louis Fed)** — the gold standard for US macro. The CSV endpoint we use is public and doesn't need registration.
- **yfinance news** — free headlines with publish timestamps per ticker.



## Demo credentials

```
email:    demo@apex500.dev
password: demo
```

Pre-seeded with 10-ticker watchlist (SPX, NDX, DJI, VIX, AAPL, NVDA, MSFT, GOOGL, TSLA, META).
