#!/usr/bin/env python3
"""
Strait Crisis Dashboard — Historical Backfill
Fetches 90 days of historical price data from Yahoo Finance and writes to Supabase.
One-time script to populate charts with real history.
"""

import os
import sys
from datetime import datetime, timezone

import requests
import yfinance as yf

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

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def fetch_historical_data():
    """Fetch 3 months of daily close prices from Yahoo Finance."""
    print("Fetching 3 months of historical data from Yahoo Finance...\n")

    all_data = {}  # {metric_key: {date_str: value}}

    for ticker_symbol, meta in TICKERS.items():
        try:
            ticker = yf.Ticker(ticker_symbol)
            hist = ticker.history(period="3mo")
            if hist.empty:
                print(f"  SKIP {ticker_symbol}: no data")
                continue

            # Build dict of date -> close price
            dates_values = {}
            for idx, row in hist.iterrows():
                # idx is a pandas Timestamp with timezone
                date_str = idx.strftime("%Y-%m-%dT16:00:00+00:00")
                dates_values[date_str] = round(float(row["Close"]), 4)

            all_data[meta["key"]] = {
                "meta": meta,
                "data": dates_values,
            }
            print(f"  OK {ticker_symbol} ({meta['key']}): {len(dates_values)} days")
            if dates_values:
                first_date = sorted(dates_values.keys())[0]
                last_date = sorted(dates_values.keys())[-1]
                print(f"      Range: {first_date[:10]} → {last_date[:10]}")
        except Exception as e:
            print(f"  FAIL {ticker_symbol}: {e}")

    return all_data


def build_records(all_data):
    """Build metric records including calculated ones for each date."""
    print("\nBuilding records (including calculated metrics)...\n")

    records = []

    # First, add the raw price records
    for metric_key, info in all_data.items():
        meta = info["meta"]
        for date_str, value in info["data"].items():
            records.append({
                "metric_key": meta["key"],
                "metric_label": meta["label"],
                "category": meta["category"],
                "value": value,
                "unit": meta["unit"],
                "source": "yahoo_finance",
                "recorded_at": date_str,
            })

    # Now calculate derived metrics per date
    # Get all unique dates across all metrics
    all_dates = set()
    for info in all_data.values():
        all_dates.update(info["data"].keys())

    sorted_dates = sorted(all_dates)
    print(f"  Total unique trading dates: {len(sorted_dates)}")

    brent_wti_count = 0
    crack_count = 0

    for date_str in sorted_dates:
        wti = all_data.get("wti_crude", {}).get("data", {}).get(date_str)
        brent = all_data.get("brent_crude", {}).get("data", {}).get(date_str)
        rbob = all_data.get("rbob_gasoline", {}).get("data", {}).get(date_str)
        ho = all_data.get("heating_oil", {}).get("data", {}).get(date_str)

        # Brent-WTI spread
        if brent is not None and wti is not None:
            spread = round(brent - wti, 4)
            records.append({
                "metric_key": "brent_wti_spread",
                "metric_label": "Brent-WTI Spread",
                "category": "Crude Oil",
                "value": spread,
                "unit": "$/bbl",
                "source": "calculated",
                "recorded_at": date_str,
            })
            brent_wti_count += 1

        # 3:2:1 Crack spread
        if wti is not None and rbob is not None and ho is not None:
            crack = round(((2 * rbob + ho) * 42 / 3) - wti, 4)
            records.append({
                "metric_key": "crack_spread_321",
                "metric_label": "3:2:1 Crack Spread",
                "category": "Refining",
                "value": crack,
                "unit": "$/bbl",
                "source": "calculated",
                "recorded_at": date_str,
            })
            crack_count += 1

    print(f"  Brent-WTI spread records: {brent_wti_count}")
    print(f"  3:2:1 Crack spread records: {crack_count}")
    print(f"  Total records to insert: {len(records)}")

    return records


def write_to_supabase(records):
    """Insert records into Supabase via REST API."""
    print(f"\nWriting {len(records)} records to Supabase...\n")

    written = 0
    skipped = 0
    failed = 0

    for i, record in enumerate(records):
        try:
            # Use upsert — delete today's record for this metric+date, then insert
            date_part = record["recorded_at"][:10]

            # Delete existing record for this metric on this date
            requests.delete(
                f"{SUPABASE_URL}/rest/v1/crisis_metrics?metric_key=eq.{record['metric_key']}&record_date=eq.{date_part}",
                headers=HEADERS,
                timeout=10,
            )

            # Insert fresh
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/crisis_metrics",
                headers=HEADERS,
                json=record,
                timeout=10,
            )
            if resp.status_code in (200, 201):
                written += 1
            else:
                # Might be a duplicate or constraint violation
                skipped += 1
        except Exception as e:
            failed += 1
            if failed <= 3:
                print(f"  FAIL {record['metric_key']} @ {record['recorded_at'][:10]}: {e}")

        if (i + 1) % 100 == 0:
            print(f"  Progress: {i + 1}/{len(records)} (written={written}, skipped={skipped}, failed={failed})")

    print(f"\n  Done: {written} written, {skipped} skipped, {failed} failed")
    return written


def main():
    print("=" * 60)
    print("Strait Crisis Dashboard — Historical Backfill (90 days)")
    print(f"Time: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)
    print()

    all_data = fetch_historical_data()
    records = build_records(all_data)
    written = write_to_supabase(records)

    print(f"\n{'=' * 60}")
    print(f"Backfill complete: {written} records written")
    print(f"Charts should now show ~90 days of history")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
