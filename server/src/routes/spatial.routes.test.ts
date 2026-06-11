import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { LatLon, ElevationGrid } from 'shared';

describe('Express Spatial API Routes Tests', () => {
  describe('GET /api/spatial/health', () => {
    it('should return 200 and health info', async () => {
      const res = await request(app).get('/api/spatial/health?no_delay=true');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('service', 'spatial-engine');
      expect(res.body).toHaveProperty('status', 'ok');
    });
  });

  describe('POST /api/spatial/boundary-area', () => {
    const ring: LatLon[] = [
      { lat: 36.740, lon: -119.920 },
      { lat: 36.740, lon: -119.910 },
      { lat: 36.732, lon: -119.910 },
      { lat: 36.732, lon: -119.920 },
    ];

    it('should return 200 and calculate area/perimeter', async () => {
      const res = await request(app)
        .post('/api/spatial/boundary-area?no_delay=true')
        .send({ ring, unit: 'acre' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('blockId', 'boundary-area');
      expect(res.body.computed.areaAcres).toBeGreaterThan(0);
      expect(res.body.outputLayers).toHaveLength(1);
      expect(res.body.outputLayers[0].type).toBe('boundary');
    });

    it('should return 400 when ring is degenerate or missing', async () => {
      const res = await request(app)
        .post('/api/spatial/boundary-area?no_delay=true')
        .send({ ring: [{ lat: 36, lon: -119 }] });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation Error');
    });
  });

  describe('POST /api/spatial/terrain-flow', () => {
    const grid: ElevationGrid = {
      values: [
        [78.5, 78.2, 77.8, 77.3, 76.9],
        [78.1, 77.7, 77.2, 76.8, 76.4],
        [77.6, 77.2, 76.7, 76.3, 75.9],
        [77.0, 76.5, 76.1, 75.7, 75.3],
        [76.3, 75.9, 75.4, 75.0, 74.6],
      ],
      cellSizeMeters: 50,
      originLat: 36.74,
      originLon: -119.92,
    };

    it('should return 200 and calculate slope points and counts', async () => {
      const res = await request(app)
        .post('/api/spatial/terrain-flow?no_delay=true')
        .send(grid);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('blockId', 'terrain-flow');
      expect(res.body.computed.avgSlopePercent).toBeGreaterThan(0);
      expect(res.body.outputLayers).toHaveLength(3); // slope, pooling, runoff
    });
  });

  describe('POST /api/spatial/carrying-capacity', () => {
    it('should return 200 and simulate logistic growth', async () => {
      const payload = {
        mode: 'logistic',
        logistic: {
          initialPopulation: 10,
          carryingCapacity: 100,
          growthRate: 0.3,
          steps: 20,
        },
      };

      const res = await request(app)
        .post('/api/spatial/carrying-capacity?no_delay=true')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('blockId', 'carrying-capacity');
      expect(res.body.computed.finalPopulation).toBeGreaterThan(0);
      expect(res.body.outputLayers[0].id).toBe('output-logistic-series');
    });

    it('should return 200 and simulate predator-prey system', async () => {
      const payload = {
        mode: 'predator-prey',
        lotkaVolterra: {
          preyPopulation: 40,
          predatorPopulation: 9,
          alpha: 0.1,
          beta: 0.02,
          delta: 0.01,
          gamma: 0.1,
          steps: 20,
          stepSize: 0.1,
        },
      };

      const res = await request(app)
        .post('/api/spatial/carrying-capacity?no_delay=true')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('blockId', 'carrying-capacity');
      expect(res.body.computed.finalPrey).toBeGreaterThanOrEqual(0);
      expect(res.body.outputLayers[0].id).toBe('output-lotka-volterra-series');
    });
  });

  describe('GET /api/spatial/demo', () => {
    it('should return 200 and demo dataset', async () => {
      const res = await request(app).get('/api/spatial/demo?no_delay=true');
      expect(res.status).toBe(200);
      expect(res.body.field).toHaveProperty('id', 'demo-field-001');
      expect(res.body.layers).toHaveProperty('terrain');
      expect(res.body.layers).toHaveProperty('soil');
    });
  });
});
