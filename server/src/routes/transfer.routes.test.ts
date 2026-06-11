import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { dbStore } from '../services/store.service';

describe('Express Data Transfer API Routes Tests', () => {
  describe('GET /api/transfer/health', () => {
    it('should return 200 and transfer status', async () => {
      const res = await request(app).get('/api/transfer/health?no_delay=true');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('supported_formats');
    });
  });

  describe('POST /api/transfer/session', () => {
    it('should create an import session and return 201', async () => {
      const res = await request(app)
        .post('/api/transfer/session?no_delay=true')
        .send({ sourceSystem: 'ClimateFieldView' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('importId');
      expect(res.body.sourceSystem).toBe('ClimateFieldView');
      expect(res.body.status).toBe('pending');
      expect(res.body.fields).toHaveLength(0);
    });

    it('should return 400 when sourceSystem is missing', async () => {
      const res = await request(app)
        .post('/api/transfer/session?no_delay=true')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Validation Error');
    });
  });

  describe('POST /api/transfer/suggest-mappings', () => {
    it('should suggest mappings for common headers', async () => {
      const res = await request(app)
        .post('/api/transfer/suggest-mappings?no_delay=true')
        .send({ headers: ['field_name', 'acres', 'grower', 'date', 'operation_type'] });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(5);
      expect(res.body[0]).toEqual({ sourceColumn: 'field_name', canonicalField: 'name' });
      expect(res.body[1]).toEqual({ sourceColumn: 'acres', canonicalField: 'areaValue' });
      expect(res.body[2]).toEqual({ sourceColumn: 'grower', canonicalField: 'growerName' });
    });
  });

  describe('CSV, GeoJSON, and Commit Flow Tests', () => {
    it('should run through a full CSV import and commit workflow', async () => {
      // 1. Create session
      const sessRes = await request(app)
        .post('/api/transfer/session?no_delay=true')
        .send({ sourceSystem: 'JohnDeereOps' });

      const importId = sessRes.body.importId;
      expect(importId).toBeDefined();

      // 2. Process CSV import
      const csvText = 
        'field_name,acres,crop,year,activity,activity_date,notes\n' +
        'North Pivot 1,120.5,Almonds,2026,planting,2026-03-15,New nonpareil planting\n' +
        'South Slope,85.2,Processing Tomatoes,2026,harvest,2026-07-20,Summer tomato harvest';

      const importRes = await request(app)
        .post('/api/transfer/import/csv?no_delay=true')
        .send({
          importId,
          csvText,
          defaultFarmId: dbStore.ranches[0].id,
        });

      expect(importRes.status).toBe(200);
      expect(importRes.body.status).toBe('validated');
      expect(importRes.body.fields).toHaveLength(2);
      expect(importRes.body.cropSeasons).toHaveLength(2);
      expect(importRes.body.operations).toHaveLength(2);
      expect(importRes.body.errors).toHaveLength(0);

      expect(importRes.body.fields[0].name).toBe('North Pivot 1');
      expect(importRes.body.operations[0].operationType).toBe('planting');

      // 3. Commit session
      const origFieldsLength = dbStore.fields.length;
      const origPlantingLength = dbStore.plantingPlans.length;
      const origHarvestLength = dbStore.harvestRecords.length;

      const commitRes = await request(app)
        .post('/api/transfer/commit?no_delay=true')
        .send({
          importId,
          defaultRanchId: dbStore.ranches[0].id,
        });

      expect(commitRes.status).toBe(200);
      expect(commitRes.body.success).toBe(true);
      expect(commitRes.body.created).toBe(2);
      expect(commitRes.body.operationsAdded).toBe(2);

      // Verify records are inserted into dbStore
      expect(dbStore.fields.length).toBe(origFieldsLength + 2);
      expect(dbStore.plantingPlans.length).toBe(origPlantingLength + 1);
      expect(dbStore.harvestRecords.length).toBe(origHarvestLength + 1);

      // Verify the field details
      const addedField = dbStore.fields.find(f => f.name === 'North Pivot 1');
      expect(addedField).toBeDefined();
      expect(addedField?.crop).toBe('Almonds');
      expect(addedField?.variety).toBe('JohnDeereOps');
    });

    it('should run through a GeoJSON import workflow', async () => {
      // 1. Create session
      const sessRes = await request(app)
        .post('/api/transfer/session?no_delay=true')
        .send({ sourceSystem: 'GIS-Shapefile' });

      const importId = sessRes.body.importId;

      // 2. Process GeoJSON
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'geo-1',
            properties: {
              name: 'West Corner 2',
              acres: 45.3,
              crop: 'Almonds',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-120.1, 36.5],
                  [-120.12, 36.5],
                  [-120.12, 36.52],
                  [-120.1, 36.52],
                  [-120.1, 36.5],
                ]
              ],
            },
          },
        ],
      };

      const importRes = await request(app)
        .post('/api/transfer/import/geojson?no_delay=true')
        .send({
          importId,
          geojson,
          defaultFarmId: dbStore.ranches[0].id,
        });

      expect(importRes.status).toBe(200);
      expect(importRes.body.status).toBe('validated');
      expect(importRes.body.fields).toHaveLength(1);
      expect(importRes.body.fields[0].name).toBe('West Corner 2');
      expect(importRes.body.cropSeasons).toHaveLength(1);
      expect(importRes.body.cropSeasons[0].cropName).toBe('Almonds');
    });
  });
});
