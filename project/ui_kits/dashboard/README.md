# Apex 500 Dashboard — UI Kit

The canonical product surface. Dark-mode first, analyst-grade density.

## Layout
- **Left nav** (240px, collapsible to 64px) — Dashboard / Predictions / Insights / Watchlist / Models / Settings
- **Top bar** (56px) — ticker search, ⌘K hint, live indicator, user avatar
- **Main canvas** — hero chart + AI overlay, metric cards, sector heatmap, correlation grid
- **Right panel** (360px, collapsible) — AI Insight feed, prediction cards, news ticker, sentiment meter

## Components (`src/`)
- `Sidebar.jsx` — left nav with collapsible groups + keyboard shortcuts
- `TopBar.jsx` — ticker search, ⌘K hint, live status, risk profile toggle, avatar
- `HeroChart.jsx` — price + prediction overlay + confidence band + timeframe toggle
- `PredictionCards.jsx` — next day / week / month AI forecast cards
- `SectorHeatmap.jsx` — 11 S&P sectors with divergent heatmap
- `CorrelationMatrix.jsx` — SPX vs NDX / DJI / VIX
- `InsightPanel.jsx` — AI-generated plain-English insights
- `WhatIfPanel.jsx` — scenario sliders (rates, inflation)
- `Watchlist.jsx` — ticker rows with sparkline + delta
- `NewsTicker.jsx` — low-profile scrolling news with sentiment tag
- `SentimentMeter.jsx` — bullish/bearish gauge
- `CommandPalette.jsx` — ⌘K overlay
- `primitives.jsx` — `Pill`, `Button`, `IconBtn`, `MetricCell`, `Card`, `Icon`

Open `index.html` for an interactive prototype. Click-through states: command palette (⌘K or click search), sidebar collapse, timeframe toggle, risk profile, What-If slider.
