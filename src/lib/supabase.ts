import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface MetricSnapshot {
  id: string;
  metric_key: string;
  metric_label: string;
  category: string;
  value: number;
  unit: string;
  source: string;
  recorded_at: string;
}

export interface MetricWithChange extends MetricSnapshot {
  prev_value: number | null;
  change: number | null;
  change_pct: number | null;
  sparkline: number[];
}

export async function getLatestMetrics(): Promise<MetricWithChange[]> {
  const { data, error } = await supabase.rpc("get_latest_metrics_with_change");

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }

  return (data || []) as MetricWithChange[];
}

export async function getMetricHistory(
  metricKey: string,
  days = 30,
): Promise<{ recorded_at: string; value: number }[]> {
  const { data, error } = await supabase.rpc("get_metric_history", {
    p_metric_key: metricKey,
    p_days: days,
  });

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }

  return (data || []) as { recorded_at: string; value: number }[];
}
