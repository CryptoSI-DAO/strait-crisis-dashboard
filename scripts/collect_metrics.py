#!/usr/bin/env python3
"""
Strait Crisis Dashboard — Data Collector
Fetches macro energy metrics from Yahoo Finance and writes to Supabase.

Runs daily via Hermes cron. Uses REST API with service_role key for writes.
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

TICKERS = {
    "CL=F": {"key": "wti_crude", "label": "WTI Crude Oil", "category": "Crude Oil", "unit": "$/bbl"},
    "BZ=F": {"key": "brent_crude", "label": "Brent Crude Oil", "category": "Crude Oil", "unit": "$/bbl"},
    "RB=F": {"key": "rbob_gasoline", "label": "RBOB Gasoline", "category": "Refined Products", "unit": "$/gal"},
    "HO=F": {"key": "heating_oil", "label": "Heating Oil", "category": "Refined Products", "unit": "$/gal"},
    "DX-Y.NYB": {"key": "dollar_index", "label": "US Dollar Index", "category": "Forex", "unit": "index"},
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


def fetch_yahoo_metrics():
    """Fetch latest prices from Yahoo Finance via yfinance."""
    results = []
    now_str = datetime.now(timezone.utc).isoformat()

    for ticker_symbol, meta in TICKERS.items():
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
        value_millions = value / 1000  # thousand barrels → millions

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
            # Delete today's record first (upsert pattern)
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            requests.delete(
                f"{SUPABASE_URL}/rest/v1/crisis_metrics?metric_key=eq.{metric['metric_key']}&record_date=eq.{today}",
                headers=HEADERS,
                timeout=10,
            )

            # Insert fresh
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
                print(f"  FAIL {metric['metric_key']}: {resp.status_code} {resp.text[:100]}")
        except Exception as e:
            print(f"  WRITE FAIL {metric['metric_key']}: {e}")

    print(f"\n  {written}/{len(metrics)} metrics written")


def main():
    print(f"=== Strait Crisis Dashboard Collector ===")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}")
    print()

    print("Fetching Yahoo Finance metrics...")
    metrics = fetch_yahoo_metrics()
    print(f"  Got {len(metrics)} metrics from Yahoo Finance")

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
