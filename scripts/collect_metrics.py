#!/usr/bin/env python3
"""
Strait Crisis Dashboard — Data Collector (v2)
Fetches macro energy metrics + tanker shipping proxies from Yahoo Finance.
Writes to Supabase. Runs daily via Hermes cron.
"""

import os
import sys
from datetime import datetime, timezone

import requests
import yfinance as yf

# --- Config ---
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://db.cryptosidao.org")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set")
    sys.exit(1)

# Raw price tickers
PRICE_TICKERS = {
    "CL=F": {"key": "wti_crude", "label": "WTI Crude Oil", "category": "Crude Oil", "unit": "$/bbl"},
    "BZ=F": {"key": "brent_crude", "label": "Brent Crude Oil", "category": "Crude Oil", "unit": "$/bbl"},
    "RB=F": {"key": "rbob_gasoline", "label": "RBOB Gasoline", "category": "Refined Products", "unit": "$/gal"},
    "HO=F": {"key": "heating_oil", "label": "Heating Oil", "category": "Refined Products", "unit": "$/gal"},
    "DX-Y.NYB": {"key": "dollar_index", "label": "US Dollar Index", "category": "Forex", "unit": "index"},
}

# Tanker shipping proxies — composite index
TANKER_TICKERS = {
    "FRO": "Frontline",
    "NAT": "Nordic American Tankers",
    "STNG": "Scorpio Tankers",
    "TNK": "Teekay Tankers",
    "INSW": "International Seaways",
}

EIA_API_KEY = os.environ.get("EIA_API_KEY", "")
EIA_SPR_URL = (
    f"https://api.eia.gov/v2/petroleum/stoc/wstk/data/"
    f"?api_key={EIA_API_KEY}&frequency=weekly&data[0]=value"
    f"&facets[product][]=EPC0&facets[series][]=STCS"
    f"&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=2"
)

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def fetch_price_metrics():
    """Fetch latest prices from Yahoo Finance."""
    results = []
    now_str = datetime.now(timezone.utc).isoformat()

    for ticker_symbol, meta in PRICE_TICKERS.items():
        try:
            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(period="2d")
            if hist.empty:
                print(f"  SKIP {ticker_symbol}: no data")
                continue

            current = float(hist["Close"].iloc[-1])
            results.append({
                "metric_key": meta["key"],
                "metric_label": meta["label"],
                "category": meta["category"],
                "value": round(current, 4),
                "unit": meta["unit"],
                "source": "yahoo_finance",
                "recorded_at": now_str,
            })
            print(f"  OK {ticker_symbol} ({meta['key']}): {current:.4f}")
        except Exception as e:
            print(f"  FAIL {ticker_symbol}: {e}")

    prices = {r["metric_key"]: r["value"] for r in results}

    # Brent-WTI spread
    if "brent_crude" in prices and "wti_crude" in prices:
        spread = prices["brent_crude"] - prices["wti_crude"]
        results.append({
            "metric_key": "brent_wti_spread",
            "metric_label": "Brent-WTI Spread",
            "category": "Crude Oil",
            "value": round(spread, 4),
            "unit": "$/bbl",
            "source": "calculated",
            "recorded_at": now_str,
        })
        print(f"  OK brent_wti_spread: {spread:.4f}")

    # 3:2:1 Crack spread
    if all(k in prices for k in ["wti_crude", "rbob_gasoline", "heating_oil"]):
        crack = ((2 * prices["rbob_gasoline"] + prices["heating_oil"]) * 42 / 3) - prices["wti_crude"]
        results.append({
            "metric_key": "crack_spread_321",
            "metric_label": "3:2:1 Crack Spread",
            "category": "Refining",
            "value": round(crack, 4),
            "unit": "$/bbl",
            "source": "calculated",
            "recorded_at": now_str,
        })
        print(f"  OK crack_spread_321: {crack:.4f}")

    return results


def fetch_tanker_index():
    """Fetch tanker stock prices, compute composite index."""
    now_str = datetime.now(timezone.utc).isoformat()
    prices = []
    labels = []

    for symbol, name in TANKER_TICKERS.items():
        try:
            t = yf.Ticker(symbol)
            hist = t.history(period="2d")
            if not hist.empty:
                price = float(hist["Close"].iloc[-1])
                prices.append(price)
                labels.append(f"{symbol}={price:.2f}")
                print(f"  OK {symbol} ({name}): ${price:.2f}")
            else:
                print(f"  SKIP {symbol}: no data")
        except Exception as e:
            print(f"  FAIL {symbol}: {e}")

    if not prices:
        print("  SKIP tanker_index: no data")
        return None

    # Composite = simple average of all tanker stock prices (normalized later)
    # We store the raw composite; the scoring engine computes 7-day change
    composite = sum(prices) / len(prices)

    result = {
        "metric_key": "tanker_index",
        "metric_label": "Tanker Shipping Index",
        "category": "Shipping",
        "value": round(composite, 4),
        "unit": "index",
        "source": "yahoo_finance",
        "recorded_at": now_str,
    }
    print(f"  OK tanker_index: {composite:.4f} (avg of {len(prices)} stocks: {', '.join(labels)})")
    return result


def fetch_spr_inventory():
    """Fetch SPR inventory from EIA API."""
    if not EIA_API_KEY:
        print("  SKIP SPR: no EIA_API_KEY set")
        return None

    try:
        resp = requests.get(EIA_SPR_URL, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        records = data.get("response", {}).get("data", [])
        if not records:
            print("  SKIP SPR: no data from EIA")
            return None

        latest = records[0]
        value = float(latest["value"])
        value_millions = value / 1000

        now_str = datetime.now(timezone.utc).isoformat()
        result = {
            "metric_key": "spr_inventory",
            "metric_label": "SPR Crude Inventory",
            "category": "Strategic Reserve",
            "value": round(value_millions, 1),
            "unit": "million bbl",
            "source": "eia",
            "recorded_at": now_str,
        }
        print(f"  OK spr_inventory: {value_millions:.1f}M bbl")
        return result
    except Exception as e:
        print(f"  FAIL SPR: {e}")
        return None


def write_to_supabase(metrics):
    """Insert metrics into Supabase via REST API."""
    written = 0
    for metric in metrics:
        try:
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            requests.delete(
                f"{SUPABASE_URL}/rest/v1/crisis_metrics?metric_key=eq.{metric['metric_key']}&record_date=eq.{today}",
                headers=HEADERS,
                timeout=10,
            )

            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/crisis_metrics",
                headers=HEADERS,
                json=metric,
                timeout=10,
            )
            if resp.status_code in (200, 201):
                written += 1
                print(f"  WROTE {metric['metric_key']}")
            else:
                print(f"  FAIL {metric['metric_key']}: {resp.status_code}")
        except Exception as e:
            print(f"  WRITE FAIL {metric['metric_key']}: {e}")

    print(f"\n  {written}/{len(metrics)} metrics written")


def main():
    print(f"=== Strait Crisis Dashboard Collector v2 ===")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}")
    print()

    print("Fetching price metrics from Yahoo Finance...")
    metrics = fetch_price_metrics()
    print(f"  Got {len(metrics)} price metrics")

    print("\nFetching tanker shipping index...")
    tanker = fetch_tanker_index()
    if tanker:
        metrics.append(tanker)

    print("\nFetching SPR inventory from EIA...")
    spr = fetch_spr_inventory()
    if spr:
        metrics.append(spr)

    print(f"\nTotal metrics: {len(metrics)}")

    print("\nWriting to Supabase...")
    write_to_supabase(metrics)

    print("\n=== Done ===")


if __name__ == "__main__":
    main()
