# Strait Crisis Dashboard

Real-time macro energy security monitor — oil, Brent, crack spread, DXY, SPR inventory.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase REST URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (read-only, RLS protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (collector script only) |
| `EIA_API_KEY` | EIA API key for SPR data (free) |

## Architecture

```
Vercel (Next.js) → Supabase (time-series metrics) ← Hermes Cron (Python collector)
```

- **Frontend:** Next.js 16 + Tailwind v4, dark theme, real-time charts
- **Database:** Supabase `crisis_metrics` table, RLS-enabled (public read)
- **Collector:** Python script using yfinance + EIA API, runs daily via Hermes cron

## Metrics Tracked

| Metric | Source |
|--------|--------|
| WTI Crude | Yahoo Finance |
| Brent Crude | Yahoo Finance |
| Brent-WTI Spread | Calculated |
| 3:2:1 Crack Spread | Calculated |
| RBOB Gasoline | Yahoo Finance |
| Heating Oil | Yahoo Finance |
| US Dollar Index (DXY) | Yahoo Finance |
| SPR Crude Inventory | EIA API |

## Database Setup

```bash
docker exec -i supabase_db psql -U postgres -d postgres < schema.sql
```

## Collector

```bash
SUPABASE_SERVICE_ROLE_KEY=xxx python3 scripts/collect_metrics.py
```

Runs daily via Hermes cron. Uses `upsert` to avoid duplicates.
