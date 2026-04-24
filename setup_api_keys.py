#!/usr/bin/env python3
"""Script to help configure API keys for Apex 500."""

import os
import sys
from pathlib import Path

def setup_api_keys():
    """Interactive setup for API keys."""
    
    print("=== Apex 500 API Key Setup ===\n")
    
    # Read current .env file
    env_file = Path(__file__).parent / ".env"
    env_example = Path(__file__).parent / ".env.example"
    
    if not env_file.exists():
        print("Creating .env file from .env.example...")
        with open(env_example, 'r') as src, open(env_file, 'w') as dst:
            dst.write(src.read())
    
    # Read current values
    with open(env_file, 'r') as f:
        lines = f.readlines()
    
    env_vars = {}
    for line in lines:
        if '=' in line and not line.strip().startswith('#'):
            key, value = line.split('=', 1)
            env_vars[key.strip()] = value.strip()
    
    print("Current API Key Configuration:")
    print(f"Finnhub API Key: {'✓ Configured' if env_vars.get('APEX_FINNHUB_KEY') else '✗ Not set'}")
    print(f"FRED API Key: {'✓ Configured' if env_vars.get('APEX_FRED_API_KEY') else '✗ Not set'}")
    print()
    
    # Finnhub setup
    if not env_vars.get('APEX_FINNHUB_KEY'):
        print("Finnhub provides reliable real-time market data.")
        print("1. Go to https://finnhub.io/")
        print("2. Sign up for a free account")
        print("3. Get your API key from the dashboard")
        print()
        
        finnhub_key = input("Enter your Finnhub API key (or press Enter to skip): ").strip()
        if finnhub_key:
            env_vars['APEX_FINNHUB_KEY'] = finnhub_key
            print("✓ Finnhub API key configured")
        else:
            print("✗ Finnhub API key skipped (will use fallback data sources)")
    else:
        print("✓ Finnhub API key already configured")
    
    print()
    
    # FRED setup
    if not env_vars.get('APEX_FRED_API_KEY'):
        print("FRED provides macroeconomic data (optional but recommended).")
        print("1. Go to https://fred.stlouisfed.org/docs/api/api_key.html")
        print("2. Request a free API key")
        print("3. Enter your key below")
        print()
        
        fred_key = input("Enter your FRED API key (or press Enter to skip): ").strip()
        if fred_key:
            env_vars['APEX_FRED_API_KEY'] = fred_key
            print("✓ FRED API key configured")
        else:
            print("✗ FRED API key skipped (will use public CSV endpoint)")
    else:
        print("✓ FRED API key already configured")
    
    # Write updated .env file
    with open(env_file, 'w') as f:
        for line in lines:
            if '=' in line and not line.strip().startswith('#'):
                key, _ = line.split('=', 1)
                key = key.strip()
                if key in env_vars:
                    f.write(f"{key}={env_vars[key]}\n")
                    del env_vars[key]
                else:
                    f.write(line)
            else:
                f.write(line)
    
    print("\n=== Configuration Complete ===")
    print("Your .env file has been updated.")
    print("\nData Source Priority:")
    print("1. Finnhub API (if key configured)")
    print("2. yfinance (free Yahoo Finance data)")
    print("3. Stooq CSV (free backup)")
    print("4. Mock data (always available)")
    print("\nRestart the backend server to apply changes.")

def test_api_keys():
    """Test configured API keys."""
    print("\n=== Testing API Keys ===")
    
    # Load environment
    env_file = Path(__file__).parent / ".env"
    with open(env_file, 'r') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                key, value = line.split('=', 1)
                os.environ[key.strip()] = value.strip()
    
    # Test Finnhub
    finnhub_key = os.environ.get('APEX_FINNHUB_KEY')
    if finnhub_key:
        try:
            import httpx
            print("Testing Finnhub API...")
            url = "https://finnhub.io/api/v1/quote"
            params = {"symbol": "AAPL", "token": finnhub_key}
            with httpx.Client(timeout=10) as client:
                r = client.get(url, params=params)
                if r.status_code == 200:
                    data = r.json()
                    if 'c' in data:
                        print(f"✓ Finnhub API working - AAPL price: ${data['c']}")
                    else:
                        print("✗ Finnhub API returned unexpected response")
                else:
                    print(f"✗ Finnhub API error: {r.status_code}")
        except Exception as e:
            print(f"✗ Finnhub API test failed: {e}")
    else:
        print("✗ Finnhub API key not configured")
    
    # Test FRED
    fred_key = os.environ.get('APEX_FRED_API_KEY')
    if fred_key:
        try:
            import httpx
            print("\nTesting FRED API...")
            url = "https://api.stlouisfed.org/fred/series/observations"
            params = {
                "series_id": "FEDFUNDS",
                "api_key": fred_key,
                "file_type": "json",
                "limit": 1
            }
            with httpx.Client(timeout=10) as client:
                r = client.get(url, params=params)
                if r.status_code == 200:
                    data = r.json()
                    if 'observations' in data:
                        print(f"✓ FRED API working - Latest Fed Funds Rate: {data['observations'][0]['value']}")
                    else:
                        print("✗ FRED API returned unexpected response")
                else:
                    print(f"✗ FRED API error: {r.status_code}")
        except Exception as e:
            print(f"✗ FRED API test failed: {e}")
    else:
        print("✗ FRED API key not configured")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_api_keys()
    else:
        setup_api_keys()
        print("\nRun 'python setup_api_keys.py test' to test your configuration.")
