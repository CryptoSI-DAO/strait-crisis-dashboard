#!/usr/bin/env python3
"""
Strait Crisis Dashboard — SPR Collector (EIA API)
Fetches SPR inventory from EIA v2 API.
"""

import os
import sys
from datetime import datetime, timezone

import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://db.cryptosidao.org")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
EIA_API_KEY = os.environ.get("EIA_API_KEY", "")

if not SUPABASE_SERVICE_KEY:
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY not set")
    sys.exit(1)
if not EIA_API_KEY:
    print("ERROR: EIA_API_KEY not set")
    sys.exit(1)

EIA_SPR_URL = "https://api.eia.gov/v2/petroleum/stoc/wstk/data/"
EIA_PARAMS = {
    "api_key": EIA_API_KEY,
    "frequency": "weekly",
    "data[0]": "value",
    "facets[duoarea][]": "NUS",
    "facets[product][]": "EPC0",
    "facets[process][]": "SAS",  # SAS = Ending Stocks of Crude Oil in SPR
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    "offset": 0,
    "length": 2,
}

SB_HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def fetch_spr_from_eia():
    """Fetch latest SPR inventory from EIA v2 API."""
    print("  Querying EIA API for SPR data...")
    try:
        resp = requests.get(EIA_SPR_URL, params=EIA_PARAMS, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        records = data.get("response", {}).get("data", [])
        if not records:
            print("  FAIL: No SPR data from EIA API")
            return None

        latest = records[0]
        value_thousands = float(latest["value"])
        value_millions = value_thousands / 1000
        period = latest.get("period", "")

        now_str = datetime.now(timezone.utc).isoformat()
        result = {
            "metric_key": "spr_inventory",
            "metric_label": "SPR Crude Inventory",
            "category": "Strategic Reserve",
            "value": round(value_millions, 1),
            "unit": "million bbl",
            "source": "eia_api",
            "recorded_at": now_str,
        }

        if len(records) >= 2:
            prev_val = float(records[1]["value"]) / 1000
            change = value_millions - prev_val
            print(f"  OK SPR: {value_millions:.1f}M bbl (week of {period}, change: {change:+.1f}M)")
        else:
            print(f"  OK SPR: {value_millions:.1f}M bbl (week of {period})")

        return result
    except Exception as e:
        print(f"  FAIL SPR API: {e}")
        return None


def write_to_supabase(metric):
    """Insert metric into Supabase."""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        requests.delete(
            f"{SUPABASE_URL}/rest/v1/crisis_metrics?metric_key=eq.spr_inventory&record_date=eq.{today}",
            headers=SB_HEADERS,
            timeout=10,
        )
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/crisis_metrics",
            headers=SB_HEADERS,
            json=metric,
            timeout=10,
        )
        if resp.status_code in (200, 201):
            print(f"  WROTE spr_inventory")
        else:
            print(f"  FAIL spr_inventory: {resp.status_code}")
    except Exception as e:
        print(f"  WRITE FAIL spr_inventory: {e}")


def main():
    print("=== SPR Collector (EIA API) ===")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}\n")

    spr = fetch_spr_from_eia()
    if spr:
        write_to_supabase(spr)
    else:
        print("  No SPR data collected")

    print("\n=== Done ===")


if __name__ == "__main__":
    main()
