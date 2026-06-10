import express from 'express';
import cors from 'cors';
import {
  mockRanches,
  mockFields,
  mockScoutingReports,
  mockWeatherSnapshots,
  mockIrrigationEvents,
  mockSoilMoistureReadings,
  mockPestObservations,
  mockSprayRecommendations,
  mockPesticideUseReports,
  mockSoilSamples,
  mockTissueSamples,
  mockNitrogenPlans,
  mockPlantingPlans,
  mockHarvestRecords,
  mockYieldRecords,
  Ranch,
  Field,
  ScoutingReport,
  IrrigationEvent,
  SprayRecommendation,
  PesticideUseReport
} from 'shared';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory data store clones so POST requests modify the state dynamically
const ranches: Ranch[] = [...mockRanches];
const fields: Field[] = [...mockFields];
const scoutingReports: ScoutingReport[] = [...mockScoutingReports];
const weatherSnapshots = [...mockWeatherSnapshots];
const irrigationEvents: IrrigationEvent[] = [...mockIrrigationEvents];
const soilMoistureReadings = [...mockSoilMoistureReadings];
const pestObservations = [...mockPestObservations];
const sprayRecommendations: SprayRecommendation[] = [...mockSprayRecommendations];
const pesticideUseReports: PesticideUseReport[] = [...mockPesticideUseReports];
const soilSamples = [...mockSoilSamples];
const tissueSamples = [...mockTissueSamples];
const nitrogenPlans = [...mockNitrogenPlans];
const plantingPlans = [...mockPlantingPlans];
const harvestRecords = [...mockHarvestRecords];
const yieldRecords = [...mockYieldRecords];

// Simulated network latency middleware (800ms delay)
app.use((req, res, next) => {
  const latency = req.query.no_delay === 'true' ? 0 : 800;
  setTimeout(next, latency);
});

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// --- API ROUTES ---

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ranches & Fields
app.get('/api/ranches', (req, res) => {
  res.json(ranches);
});

app.get('/api/fields', (req, res) => {
  const { ranchId } = req.query;
  if (ranchId) {
    return res.json(fields.filter(f => f.ranchId === ranchId));
  }
  res.json(fields);
});

app.get('/api/fields/:id', (req, res) => {
  const field = fields.find(f => f.id === req.params.id);
  if (!field) return res.status(404).json({ error: 'Field not found' });
  res.json(field);
});

app.post('/api/fields', (req, res) => {
  const newField: Field = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  fields.push(newField);
  res.status(211).json(newField);
});

// Scouting
app.get('/api/scouting-reports', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(scoutingReports.filter(r => r.fieldId === fieldId));
  }
  res.json(scoutingReports);
});

app.get('/api/scouting-reports/:id', (req, res) => {
  const report = scoutingReports.find(r => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Scouting report not found' });
  res.json(report);
});

app.post('/api/scouting-reports', (req, res) => {
  const newReport: ScoutingReport = {
    id: generateId(),
    scoutedAt: new Date().toISOString(),
    ...req.body
  };
  scoutingReports.push(newReport);
  
  // Update lastScouted on field
  const field = fields.find(f => f.id === newReport.fieldId);
  if (field) {
    field.lastScouted = newReport.scoutedAt;
  }
  
  res.status(201).json(newReport);
});

// Water & Irrigation
app.get('/api/weather', (req, res) => {
  const { ranchId } = req.query;
  if (ranchId) {
    return res.json(weatherSnapshots.filter(w => w.ranchId === ranchId));
  }
  res.json(weatherSnapshots);
});

app.get('/api/irrigation-events', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(irrigationEvents.filter(ie => ie.fieldId === fieldId));
  }
  res.json(irrigationEvents);
});

app.post('/api/irrigation-events', (req, res) => {
  const newEvent: IrrigationEvent = {
    id: generateId(),
    status: 'scheduled',
    ...req.body
  };
  irrigationEvents.push(newEvent);
  res.status(201).json(newEvent);
});

app.patch('/api/irrigation-events/:id', (req, res) => {
  const event = irrigationEvents.find(ie => ie.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Irrigation event not found' });
  
  Object.assign(event, req.body);
  res.json(event);
});

app.get('/api/soil-moisture', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(soilMoistureReadings.filter(sm => sm.fieldId === fieldId));
  }
  res.json(soilMoistureReadings);
});

// Pest & PCA
app.get('/api/pest-observations', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(pestObservations.filter(po => po.fieldId === fieldId));
  }
  res.json(pestObservations);
});

app.get('/api/spray-recommendations', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(sprayRecommendations.filter(rec => rec.fieldId === fieldId));
  }
  res.json(sprayRecommendations);
});

app.post('/api/spray-recommendations', (req, res) => {
  const newRec: SprayRecommendation = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    status: 'draft',
    ...req.body
  };
  sprayRecommendations.push(newRec);
  res.status(201).json(newRec);
});

app.patch('/api/spray-recommendations/:id', (req, res) => {
  const rec = sprayRecommendations.find(r => r.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'Spray recommendation not found' });
  
  Object.assign(rec, req.body);
  res.json(rec);
});

app.get('/api/pesticide-use-reports', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(pesticideUseReports.filter(pur => pur.fieldId === fieldId));
  }
  res.json(pesticideUseReports);
});

app.post('/api/pesticide-use-reports', (req, res) => {
  const newPur: PesticideUseReport = {
    id: generateId(),
    status: 'pending-submission',
    ...req.body
  };
  pesticideUseReports.push(newPur);
  res.status(201).json(newPur);
});

// Nutrients
app.get('/api/soil-samples', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(soilSamples.filter(s => s.fieldId === fieldId));
  }
  res.json(soilSamples);
});

app.get('/api/tissue-samples', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(tissueSamples.filter(t => t.fieldId === fieldId));
  }
  res.json(tissueSamples);
});

app.get('/api/nitrogen-plans', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(nitrogenPlans.filter(np => np.fieldId === fieldId));
  }
  res.json(nitrogenPlans);
});

// Crop Planning
app.get('/api/planting-plans', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(plantingPlans.filter(p => p.fieldId === fieldId));
  }
  res.json(plantingPlans);
});

app.get('/api/harvest-records', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(harvestRecords.filter(h => h.fieldId === fieldId));
  }
  res.json(harvestRecords);
});

app.get('/api/yield-records', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(yieldRecords.filter(y => y.fieldId === fieldId));
  }
  res.json(yieldRecords);
});

app.listen(port, () => {
  console.log(`Express mock API running at http://localhost:${port}`);
});
