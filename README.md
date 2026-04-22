# Apex 500

Apex 500 is a full-stack S&P 500 forecasting platform that combines multiple machine learning models with an interactive dashboard to analyze market behavior and generate short-term predictions.

The system pulls real market data, processes it through a unified feature pipeline, and produces forecasts using both classical and deep learning approaches. These outputs are combined into a single confidence-weighted ensemble.

---

## What this project does

- Fetches real-time and historical market data  
- Generates predictions using multiple ML models  
- Combines outputs using a weighted ensemble  
- Visualizes forecasts, trends, and correlations  
- Provides backtesting and performance metrics  
- Displays sentiment and macro-level signals  

---

## Models used

- ARIMA (time-series baseline)  
- Random Forest (directional classification)  
- Gradient Boosting (return prediction)  
- LSTM (sequence modeling)  
- Transformer (attention-based modeling)  
- Ensemble (combined prediction)  
- GARCH / EWMA (volatility estimation)  

---

## Prediction Flow

```
Market Data → Feature Engineering → Individual Models
                                      ↓
         ARIMA     RF     Boost     LSTM     Transformer
            \       |       |        |         /
             -------- Ensemble (weighted) ------
                           ↓
                    Final Forecast
```

---

## Example Forecast Output

```
Price
  ^
  |        ─────── predicted
  |      /
  |    /
  |  /
  | /
  |/__________________________> Time

Confidence Band (±95%)
```

---

## Tech Stack

### Frontend
- React (Vite)
- Three.js
- React Router
- WebSockets

### Backend
- FastAPI
- SQLite
- yfinance
- FRED

### Machine Learning
- PyTorch (LSTM, Transformer)
- scikit-learn (Random Forest, Gradient Boosting)
- statsmodels (ARIMA)
- arch / EWMA (volatility)

---

## System Architecture

```
Frontend (React + Three.js)
        ↓
FastAPI Backend (REST + WebSocket)
        ↓
ML Pipeline (PyTorch + sklearn + statsmodels)
        ↓
SQLite + External Data Sources
```

---

## Key Features

- Real-time market dashboard  
- AI-based price forecasting  
- Walk-forward backtesting  
- Sector and correlation analysis  
- Sentiment-based insights  
- Watchlist with signals  

---

## Notes

- Fully local setup (no paid APIs required)  
- CPU-friendly models (~1s inference per model)  
- Modular design for easy extension  
