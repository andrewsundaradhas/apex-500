"""S&P 500 constituents loader.

Primary: scrape Wikipedia's SP 500 component list (public, stable format).
Fallback: a static list of ~60 of the largest SP 500 members by market cap.
"""
from __future__ import annotations

import logging
from typing import List, Dict

from ..db.database import cursor

log = logging.getLogger("apex.services.sp500")

# Static fallback — trimmed to ~60 high-weight names so we always have *something*
FALLBACK = [
    ("AAPL", "Apple Inc.", "Information Technology", "Technology Hardware"),
    ("MSFT", "Microsoft Corp.", "Information Technology", "Systems Software"),
    ("NVDA", "NVIDIA Corp.", "Information Technology", "Semiconductors"),
    ("GOOGL", "Alphabet Inc. Class A", "Communication Services", "Interactive Media"),
    ("GOOG", "Alphabet Inc. Class C", "Communication Services", "Interactive Media"),
    ("AMZN", "Amazon.com Inc.", "Consumer Discretionary", "Broadline Retail"),
    ("META", "Meta Platforms Inc.", "Communication Services", "Interactive Media"),
    ("TSLA", "Tesla Inc.", "Consumer Discretionary", "Automobile Manufacturers"),
    ("BRK.B", "Berkshire Hathaway Inc.", "Financials", "Multi-Sector Holdings"),
    ("LLY", "Eli Lilly and Co.", "Health Care", "Pharmaceuticals"),
    ("AVGO", "Broadcom Inc.", "Information Technology", "Semiconductors"),
    ("JPM", "JPMorgan Chase & Co.", "Financials", "Diversified Banks"),
    ("V", "Visa Inc.", "Financials", "Transaction & Payment Processing"),
    ("XOM", "Exxon Mobil Corp.", "Energy", "Integrated Oil & Gas"),
    ("UNH", "UnitedHealth Group Inc.", "Health Care", "Managed Health Care"),
    ("MA", "Mastercard Inc.", "Financials", "Transaction & Payment Processing"),
    ("PG", "Procter & Gamble Co.", "Consumer Staples", "Personal Products"),
    ("JNJ", "Johnson & Johnson", "Health Care", "Pharmaceuticals"),
    ("HD", "Home Depot Inc.", "Consumer Discretionary", "Home Improvement Retail"),
    ("COST", "Costco Wholesale Corp.", "Consumer Staples", "Consumer Staples Merchandise Retail"),
    ("ORCL", "Oracle Corp.", "Information Technology", "Systems Software"),
    ("BAC", "Bank of America Corp.", "Financials", "Diversified Banks"),
    ("MRK", "Merck & Co.", "Health Care", "Pharmaceuticals"),
    ("ABBV", "AbbVie Inc.", "Health Care", "Biotechnology"),
    ("CVX", "Chevron Corp.", "Energy", "Integrated Oil & Gas"),
    ("KO", "Coca-Cola Co.", "Consumer Staples", "Soft Drinks & Non-alcoholic Beverages"),
    ("PEP", "PepsiCo Inc.", "Consumer Staples", "Soft Drinks & Non-alcoholic Beverages"),
    ("WMT", "Walmart Inc.", "Consumer Staples", "Consumer Staples Merchandise Retail"),
    ("CRM", "Salesforce Inc.", "Information Technology", "Application Software"),
    ("NFLX", "Netflix Inc.", "Communication Services", "Movies & Entertainment"),
    ("AMD", "Advanced Micro Devices", "Information Technology", "Semiconductors"),
    ("ADBE", "Adobe Inc.", "Information Technology", "Application Software"),
    ("TMO", "Thermo Fisher Scientific", "Health Care", "Life Sciences Tools & Services"),
    ("ACN", "Accenture plc", "Information Technology", "IT Consulting & Other Services"),
    ("LIN", "Linde plc", "Materials", "Industrial Gases"),
    ("MCD", "McDonald's Corp.", "Consumer Discretionary", "Restaurants"),
    ("ABT", "Abbott Laboratories", "Health Care", "Health Care Equipment"),
    ("DIS", "Walt Disney Co.", "Communication Services", "Movies & Entertainment"),
    ("CSCO", "Cisco Systems Inc.", "Information Technology", "Communications Equipment"),
    ("WFC", "Wells Fargo & Co.", "Financials", "Diversified Banks"),
    ("IBM", "IBM Corp.", "Information Technology", "IT Consulting & Other Services"),
    ("INTC", "Intel Corp.", "Information Technology", "Semiconductors"),
    ("TXN", "Texas Instruments Inc.", "Information Technology", "Semiconductors"),
    ("QCOM", "Qualcomm Inc.", "Information Technology", "Semiconductors"),
    ("GE", "GE Aerospace", "Industrials", "Aerospace & Defense"),
    ("CAT", "Caterpillar Inc.", "Industrials", "Construction Machinery"),
    ("AMAT", "Applied Materials Inc.", "Information Technology", "Semiconductor Materials"),
    ("PFE", "Pfizer Inc.", "Health Care", "Pharmaceuticals"),
    ("BA", "Boeing Co.", "Industrials", "Aerospace & Defense"),
    ("PM", "Philip Morris International", "Consumer Staples", "Tobacco"),
    ("BLK", "BlackRock Inc.", "Financials", "Asset Management"),
    ("GS", "Goldman Sachs Group", "Financials", "Investment Banking & Brokerage"),
    ("AXP", "American Express Co.", "Financials", "Consumer Finance"),
    ("NKE", "Nike Inc.", "Consumer Discretionary", "Footwear"),
    ("UBER", "Uber Technologies", "Industrials", "Passenger Ground Transportation"),
    ("SPGI", "S&P Global Inc.", "Financials", "Financial Exchanges & Data"),
    ("T", "AT&T Inc.", "Communication Services", "Integrated Telecommunication Services"),
    ("VZ", "Verizon Communications", "Communication Services", "Integrated Telecommunication Services"),
    ("HON", "Honeywell International", "Industrials", "Industrial Conglomerates"),
    ("SCHW", "Charles Schwab Corp.", "Financials", "Investment Banking & Brokerage"),
    ("NOW", "ServiceNow Inc.", "Information Technology", "Application Software"),
]


def fetch_wikipedia_constituents() -> List[Dict]:
    """Pull the current SP 500 list from Wikipedia. Returns [] on any failure."""
    try:
        import pandas as pd
        tables = pd.read_html("https://en.wikipedia.org/wiki/List_of_S%26P_500_companies")
        if not tables:
            return []
        df = tables[0]
        cols = {c.lower(): c for c in df.columns}
        return [
            {
                "ticker":       str(row[cols["symbol"]]).replace(".", "-"),
                "name":         str(row[cols["security"]]),
                "sector":       str(row[cols["gics sector"]]),
                "sub_industry": str(row[cols["gics sub-industry"]]) if "gics sub-industry" in cols else "",
                "added_date":   str(row[cols["date added"]]) if "date added" in cols else "",
            }
            for _, row in df.iterrows()
        ]
    except Exception as e:
        log.warning("Wikipedia SP500 fetch failed: %s", e)
        return []


def ensure_sp500_seeded() -> int:
    """Populate sp500_constituents table if empty."""
    with cursor() as c:
        n = c.execute("SELECT COUNT(*) AS n FROM sp500_constituents").fetchone()["n"]
    if n > 0:
        return n

    rows = fetch_wikipedia_constituents() or [
        {"ticker": t, "name": n, "sector": s, "sub_industry": si, "added_date": ""}
        for (t, n, s, si) in FALLBACK
    ]
    log.info("Seeding sp500_constituents with %d rows", len(rows))

    with cursor() as c:
        for r in rows:
            c.execute(
                "INSERT OR REPLACE INTO sp500_constituents (ticker, name, sector, sub_industry, added_date) VALUES (?,?,?,?,?)",
                (r["ticker"], r["name"], r["sector"], r.get("sub_industry", ""), r.get("added_date", "")),
            )
    return len(rows)


def list_constituents(sector: str | None = None, limit: int = 500) -> List[Dict]:
    with cursor() as c:
        if sector:
            rows = c.execute(
                "SELECT * FROM sp500_constituents WHERE sector = ? ORDER BY ticker LIMIT ?",
                (sector, limit),
            ).fetchall()
        else:
            rows = c.execute(
                "SELECT * FROM sp500_constituents ORDER BY ticker LIMIT ?", (limit,),
            ).fetchall()
    return [dict(r) for r in rows]
