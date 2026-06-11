import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Express ML API Routes Tests', () => {
  describe('GET /api/ml/health', () => {
    it('should return 200 and health info', async () => {
      const res = await request(app).get('/api/ml/health?no_delay=true');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('demo_mode', true);
      expect(res.body).toHaveProperty('active_models');
    });
  });

  describe('POST /api/ml/yield/predict', () => {
    it('should return 200 and a yield prediction', async () => {
      const res = await request(app)
        .post('/api/ml/yield/predict?no_delay=true')
        .send({ field_id: 'f1', crop_name: 'Almond' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('field_id', 'f1');
      expect(res.body).toHaveProperty('crop_name', 'Almond');
      expect(res.body).toHaveProperty('predicted_yield_kg_ha');
      expect(res.body).toHaveProperty('baseline_yield_kg_ha');
      expect(res.body).toHaveProperty('limiting_factors');
    });

    it('should return 400 when field_id or crop_name is missing', async () => {
      const res = await request(app)
        .post('/api/ml/yield/predict?no_delay=true')
        .send({ field_id: 'f1' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation Error');
    });
  });

  describe('GET /api/ml/yield/history/:fieldId', () => {
    it('should return 200 and historical data', async () => {
      const res = await request(app).get('/api/ml/yield/history/f1?crop=Almonds&no_delay=true');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('field_id', 'f1');
      expect(res.body).toHaveProperty('crop_name', 'Almonds');
      expect(Array.isArray(res.body.history)).toBe(true);
      expect(res.body.history.length).toBeGreaterThan(0);
      expect(res.body.history[0]).toHaveProperty('crop_year');
      expect(res.body.history[0]).toHaveProperty('yield_kg_ha');
    });
  });

  describe('POST /api/ml/optimize/inputs', () => {
    it('should return 200 and optimized inputs recommendation', async () => {
      const res = await request(app)
        .post('/api/ml/optimize/inputs?no_delay=true')
        .send({ field_id: 'f1', irrigation_in: 40 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('field_id', 'f1');
      expect(res.body).toHaveProperty('rec_irrigation_in');
      expect(res.body).toHaveProperty('rec_nitrogen_lb_ac');
      expect(res.body).toHaveProperty('expected_yield_kg_ha');
    });
  });

  describe('POST /api/ml/risk/assess', () => {
    it('should return 200 and risk assessment for field-001', async () => {
      const res = await request(app)
        .post('/api/ml/risk/assess?no_delay=true')
        .send({ field_id: 'field-001' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('field_id', 'field-001');
      expect(res.body).toHaveProperty('risk_label', 'high');
      expect(res.body).toHaveProperty('anomaly_score', 0.68);
    });

    it('should return 200 and fallback risk assessment for unknown field', async () => {
      const res = await request(app)
        .post('/api/ml/risk/assess?no_delay=true')
        .send({ field_id: 'unknown-field' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('field_id', 'unknown-field');
      expect(res.body).toHaveProperty('risk_label', 'low');
    });
  });

  describe('GET /api/ml/risk/summary', () => {
    it('should return 200 and risk summary list', async () => {
      const res = await request(app).get('/api/ml/risk/summary?no_delay=true');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('crop_year', 2026);
      expect(Array.isArray(res.body.fields)).toBe(true);
      expect(res.body.fields.length).toBe(3);
    });
  });

  describe('POST /api/ml/benchmark/compare', () => {
    it('should return 200 and benchmarking comparisons', async () => {
      const res = await request(app)
        .post('/api/ml/benchmark/compare?no_delay=true')
        .send({ field_id: 'f1' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('field_id', 'f1');
      expect(res.body).toHaveProperty('percentile_rank');
      expect(res.body).toHaveProperty('cohort_size');
    });
  });

  describe('GET /api/ml/benchmark/clusters', () => {
    it('should return 200 and clusters list', async () => {
      const res = await request(app).get('/api/ml/benchmark/clusters?no_delay=true');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.clusters)).toBe(true);
      expect(res.body.clusters.length).toBe(6);
    });
  });

  describe('POST /api/ml/train/:mtype', () => {
    it('should return 200 and success status for yield model training', async () => {
      const res = await request(app).post('/api/ml/train/yield?no_delay=true');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body.results).toHaveProperty('yield');
    });

    it('should return 400 for invalid model type', async () => {
      const res = await request(app).post('/api/ml/train/invalid-model?no_delay=true');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation Error');
    });
  });
});
