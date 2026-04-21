"""News service with lexicon-based sentiment.

Real wire: yfinance ticker news (free). Sentiment: a tiny curated lexicon —
not state-of-the-art, but deterministic and good enough to color headlines.
"""
from __future__ import annotations

import logging
import re
from typing import Dict, List, Optional

from ..db.database import cursor

log = logging.getLogger("apex.services.news")

POSITIVE = {
    "beat", "beats", "surge", "surged", "rally", "rallies", "soar", "soared",
    "record", "record-high", "gain", "gains", "outperform", "bullish", "upgraded",
    "growth", "profit", "strong", "boom", "jump", "jumps", "climb", "climbs",
    "raised", "upbeat", "optimism", "expansion", "wins",
}
NEGATIVE = {
    "miss", "misses", "plunge", "plunged", "crash", "crashes", "tumble", "tumbled",
    "weak", "weaker", "bearish", "downgraded", "loss", "losses", "decline", "declines",
    "slump", "slowdown", "fears", "concerns", "warning", "warned", "recession",
    "cut", "cuts", "drop", "drops", "fall", "falls", "sell-off", "selloff",
}


def score_headline(text: str) -> float:
    if not text:
        return 0.0
    tokens = set(re.findall(r"[a-zA-Z-]+", text.lower()))
    pos = len(tokens & POSITIVE)
    neg = len(tokens & NEGATIVE)
    total = pos + neg
    if total == 0:
        return 0.0
    return round((pos - neg) / total, 3)


def tone_from_score(s: float) -> str:
    if s > 0.2:  return "pos"
    if s < -0.2: return "neg"
    return "ai"


def _fetch_yfinance_news(ticker: str) -> List[Dict]:
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        raw = t.news or []
        out = []
        for item in raw[:12]:
            content = item.get("content") or item
            headline = content.get("title") or item.get("title", "")
            if not headline:
                continue
            url = (content.get("canonicalUrl") or {}).get("url") or content.get("link", "") or item.get("link", "")
            pub = content.get("pubDate") or item.get("providerPublishTime", "")
            out.append({"headline": headline, "url": url, "source": (content.get("provider") or {}).get("displayName", "Yahoo Finance"), "published_at": str(pub)})
        return out
    except Exception as e:
        log.warning("yfinance news fetch failed for %s: %s", ticker, e)
        return []


DEFAULT_HEADLINES = [
    {"headline": "Nvidia Q1 revenue beats estimates by 8%, raises guidance", "source": "Bloomberg"},
    {"headline": "Retail sales in April softens, consumer sentiment slips", "source": "Reuters"},
    {"headline": "Fed minutes signal patience on rate cuts, dovish skew emerging", "source": "Wall Street Journal"},
    {"headline": "Regional banks see unusual options volume, analysts flag caution", "source": "Financial Times"},
    {"headline": "Oil prices jump on Middle East tensions, energy stocks rally", "source": "CNBC"},
    {"headline": "Tech sector broadens as small caps outperform for third week", "source": "MarketWatch"},
    {"headline": "Apple upgraded by three analysts on AI roadmap, price targets raised", "source": "Seeking Alpha"},
    {"headline": "Tesla deliveries miss, competitive pressure in China mounts", "source": "Barron's"},
]


def fetch_news(ticker: Optional[str] = None, limit: int = 10) -> List[Dict]:
    """Fetch news + score sentiment. Persist to DB, return newest N."""
    headlines: List[Dict] = []
    if ticker:
        headlines = _fetch_yfinance_news(ticker)
    if not headlines:
        headlines = DEFAULT_HEADLINES[:]

    results = []
    with cursor() as c:
        for item in headlines:
            s = score_headline(item["headline"])
            tone = tone_from_score(s)
            rec = {
                "ticker": ticker, "headline": item["headline"],
                "source": item.get("source", ""), "url": item.get("url", ""),
                "sentiment": s, "tone": tone,
                "published_at": item.get("published_at", ""),
            }
            try:
                c.execute(
                    "INSERT INTO news (ticker, headline, source, url, sentiment, tone, published_at)"
                    " VALUES (?,?,?,?,?,?,?)",
                    (rec["ticker"], rec["headline"], rec["source"], rec["url"],
                     rec["sentiment"], rec["tone"], rec["published_at"]),
                )
            except Exception:
                pass
            results.append(rec)

    return results[:limit]


def aggregate_sentiment(ticker: Optional[str] = None, lookback: int = 50) -> Dict:
    """Return an aggregate bullish/bearish score in [0, 100] from recent headlines."""
    with cursor() as c:
        if ticker:
            rows = c.execute(
                "SELECT sentiment FROM news WHERE ticker = ? ORDER BY created_at DESC LIMIT ?",
                (ticker, lookback),
            ).fetchall()
        else:
            rows = c.execute("SELECT sentiment FROM news ORDER BY created_at DESC LIMIT ?", (lookback,)).fetchall()

    if not rows:
        return {"score": 50, "label": "Neutral", "n": 0}

    scores = [float(r["sentiment"] or 0) for r in rows]
    mean = sum(scores) / len(scores)
    # Map [-1, 1] → [0, 100]
    norm = int(round((mean + 1) * 50))
    if   norm > 60: label = "Bullish"
    elif norm > 52: label = "Moderately bullish"
    elif norm > 48: label = "Neutral"
    elif norm > 40: label = "Moderately bearish"
    else:           label = "Bearish"
    return {"score": norm, "label": label, "n": len(rows)}
