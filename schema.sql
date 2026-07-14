-- Strait Crisis Dashboard — Supabase schema
-- Run via: docker exec -i supabase_db psql -U postgres -d postgres < schema.sql

-- Metrics table — one row per metric per snapshot
CREATE TABLE IF NOT EXISTS crisis_metrics (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_key  TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'energy',
  value       NUMERIC NOT NULL,
  unit        TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'yahoo_finance',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_crisis_metrics_key_time
  ON crisis_metrics (metric_key, recorded_at DESC);

-- Unique constraint — one snapshot per metric per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_crisis_metrics_unique
  ON crisis_metrics (metric_key, DATE(recorded_at));

-- Enable RLS
ALTER TABLE crisis_metrics ENABLE ROW LEVEL SECURITY;

-- Public read access (anon key can read)
CREATE POLICY "public_read_crisis_metrics" ON crisis_metrics
  FOR SELECT TO anon USING (true);

-- Service role can do everything (bypasses RLS)
-- No write policy for anon — only service_role can insert

-- RPC: Get latest metrics with change vs previous day
CREATE OR REPLACE FUNCTION get_latest_metrics_with_change()
RETURNS TABLE (
  metric_key TEXT,
  metric_label TEXT,
  category TEXT,
  value NUMERIC,
  unit TEXT,
  source TEXT,
  recorded_at TIMESTAMPTZ,
  prev_value NUMERIC,
  change NUMERIC,
  change_pct NUMERIC,
  sparkline NUMERIC[]
)
LANGUAGE sql
STABLE
AS $$
  WITH latest AS (
    SELECT DISTINCT ON (metric_key)
      metric_key, metric_label, category, value, unit, source, recorded_at
    FROM crisis_metrics
    ORDER BY metric_key, recorded_at DESC
  ),
  previous AS (
    SELECT DISTINCT ON (metric_key)
      metric_key AS pk, value AS prev_value
    FROM crisis_metrics
    WHERE recorded_at < (
      SELECT MAX(recorded_at) FROM crisis_metrics
    )
    ORDER BY metric_key, recorded_at DESC
  ),
  spark AS (
    SELECT metric_key AS sk, array_agg(value ORDER BY recorded_at) AS sparkline
    FROM (
      SELECT metric_key, value, recorded_at
      FROM crisis_metrics cm
      WHERE recorded_at >= now() - INTERVAL '30 days'
      ORDER BY metric_key, recorded_at
    ) s
    GROUP BY metric_key
  )
  SELECT
    l.metric_key,
    l.metric_label,
    l.category,
    l.value,
    l.unit,
    l.source,
    l.recorded_at,
    p.prev_value,
    CASE WHEN p.prev_value IS NOT NULL THEN l.value - p.prev_value ELSE NULL END,
    CASE WHEN p.prev_value IS NOT NULL AND p.prev_value != 0
      THEN ((l.value - p.prev_value) / p.prev_value) * 100
      ELSE NULL END,
    COALESCE(sp.sparkline, ARRAY[]::NUMERIC[])
  FROM latest l
  LEFT JOIN previous p ON l.metric_key = p.pk
  LEFT JOIN spark sp ON l.metric_key = sp.sk;
$$;

-- RPC: Get metric history for N days
CREATE OR REPLACE FUNCTION get_metric_history(
  p_metric_key TEXT,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  recorded_at TIMESTAMPTZ,
  value NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  SELECT recorded_at, value
  FROM crisis_metrics
  WHERE metric_key = p_metric_key
    AND recorded_at >= now() - (p_days || ' days')::INTERVAL
  ORDER BY recorded_at ASC;
$$;
