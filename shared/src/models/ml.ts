export interface YieldPrediction {
  field_id: string;
  crop_name: string;
  crop_year: number;
  predicted_yield_kg_ha: number;
  yield_lower_kg_ha: number;
  yield_upper_kg_ha: number;
  baseline_yield_kg_ha: number;
  confidence: 'low' | 'medium' | 'high';
  factor_water: number;
  factor_nutrient: number;
  factor_heat: number;
  factor_uv: number;
  factor_seed: number;
  factor_planting: number;
  limiting_factors: string[];
  explanation: string;
  disclaimer: string;
}

export interface OptimizationResult {
  field_id: string;
  crop_year: number;
  current_irrigation_in: number;
  rec_irrigation_in: number;
  irrigation_delta_in: number;
  current_nitrogen_lb_ac: number;
  rec_nitrogen_lb_ac: number;
  nitrogen_delta_lb_ac: number;
  expected_yield_kg_ha: number;
  expected_yield_gain_pct: number;
  baseline_yield_kg_ha: number;
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
  disclaimer: string;
}

export interface RiskAssessment {
  field_id: string;
  crop_year: number;
  anomaly_score: number;
  risk_label: 'low' | 'moderate' | 'high' | 'critical';
  residual_zscore: number;
  top_risk_factors: string[];
  cohort_id: number;
  cohort_name: string;
  explanation: string;
  disclaimer: string;
}

export interface RiskSummary {
  crop_year: number;
  fields: RiskAssessment[];
}

export interface BenchmarkResult {
  field_id: string;
  crop_year: number;
  cluster_label: number;
  cluster_name: string;
  yield_kg_ha: number;
  percentile_rank: number;
  cohort_size: number;
  explanation: string;
  disclaimer: string;
}

export interface ClusterInfo {
  cluster_label: number;
  cluster_name: string;
}

export interface MlHealthStatus {
  status: 'ok' | 'degraded';
  demo_mode: boolean;
  active_models: Record<string, string | null>;
}

export interface FieldYieldHistory {
  field_id: string;
  crop_name: string;
  history: Array<{
    crop_year: number;
    yield_kg_ha: number;
    irrigation_in: number;
    nitrogen_applied_lb_ac: number;
  }>;
}
