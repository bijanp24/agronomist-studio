import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from './app';
import { dbStore } from './services/store.service';
import { mockRanches } from 'shared';

describe('Express API Server Tests', () => {
  // Before each test, we can reset/check the store if needed
  beforeEach(() => {
    // Reset our dbStore collections to clean slate or cloned mocks
    dbStore.ranches = JSON.parse(JSON.stringify(mockRanches));
  });

  describe('GET /api/health', () => {
    it('should return 200 OK and contain health status info', async () => {
      // Use no_delay=true query parameter to bypass simulated network latency in tests
      const res = await request(app).get('/api/health?no_delay=true');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/ranches', () => {
    it('should return 200 and list of ranches', async () => {
      const res = await request(app).get('/api/ranches?no_delay=true');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
    });
  });

  describe('GET /api/fields', () => {
    it('should return 200 and list of fields', async () => {
      const res = await request(app).get('/api/fields?no_delay=true');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter fields by ranchId query parameter', async () => {
      const ranchId = dbStore.ranches[0].id;
      const res = await request(app).get(`/api/fields?ranchId=${ranchId}&no_delay=true`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((field: any) => {
        expect(field.ranchId).toBe(ranchId);
      });
    });
  });

  describe('POST /api/fields (Zod Validation & Mass-Assignment Checks)', () => {
    it('should return 400 Validation Error for empty body', async () => {
      const res = await request(app)
        .post('/api/fields?no_delay=true')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation Error');
      expect(res.body).toHaveProperty('details');
      expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('should successfully create a field and return 201 with server-managed id and createdAt', async () => {
      const ranchId = dbStore.ranches[0].id;
      const newFieldPayload = {
        ranchId,
        name: 'Test Almond Block 4',
        crop: 'Almonds',
        variety: 'Nonpareil',
        areaAcres: 45.5,
        county: 'Fresno',
        status: 'healthy'
      };

      const res = await request(app)
        .post('/api/fields?no_delay=true')
        .send(newFieldPayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      // Should be a valid UUID (36 chars)
      expect(res.body.id.length).toBe(36);
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body.name).toBe(newFieldPayload.name);
      expect(res.body.crop).toBe(newFieldPayload.crop);
    });

    it('should protect against mass assignment injection of custom id and createdAt', async () => {
      const ranchId = dbStore.ranches[0].id;
      const maliciousPayload = {
        ranchId,
        name: 'Injected Block',
        crop: 'Almonds',
        areaAcres: 20,
        county: 'Fresno',
        status: 'critical',
        id: 'hacked-id-12345',
        createdAt: '1970-01-01T00:00:00.000Z'
      };

      const res = await request(app)
        .post('/api/fields?no_delay=true')
        .send(maliciousPayload);

      expect(res.status).toBe(201);
      // The server MUST ignore or overwrite the supplied ID and createdAt
      expect(res.body.id).not.toBe(maliciousPayload.id);
      expect(res.body.id.length).toBe(36); // should be a secure UUID
      expect(res.body.createdAt).not.toBe(maliciousPayload.createdAt);
      
      // Ensure the newly created field actually exists in the dbStore
      const foundField = dbStore.fields.find(f => f.id === res.body.id);
      expect(foundField).toBeDefined();
      expect(foundField?.name).toBe('Injected Block');
    });
  });

  describe('PATCH /api/irrigation-events/:id', () => {
    it('should return 404 for updating non-existent event', async () => {
      const res = await request(app)
        .patch('/api/irrigation-events/non-existent-id?no_delay=true')
        .send({ status: 'completed' });

      expect(res.status).toBe(404);
    });

    it('should successfully update irrigation status and protect against id modifications', async () => {
      const originalEvent = dbStore.irrigationEvents[0];
      const res = await request(app)
        .patch(`/api/irrigation-events/${originalEvent.id}?no_delay=true`)
        .send({
          status: 'completed',
          id: 'fake-overwritten-id',
          appliedInches: 2.4
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.id).toBe(originalEvent.id); // ID must remain untouched
      expect(res.body.appliedInches).toBe(2.4);
    });
  });

  describe('404 Not Found handling', () => {
    it('should return 404 and structured error for non-existent route', async () => {
      const res = await request(app).get('/api/invalid-route-name?no_delay=true');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Not Found');
    });
  });
});
