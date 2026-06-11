import { Router } from 'express';
import { dbStore } from '../services/store.service';
import { validateBody } from '../middleware/validation.middleware';
import { WeatherSnapshot, SoilMoistureReading, IrrigationEvent } from 'shared';
import { createIrrigationEventSchema, updateIrrigationEventSchema } from '../schemas/agronomy.schemas';
import crypto from 'crypto';

const router = Router();

router.get('/weather', (req, res) => {
  const { ranchId } = req.query;
  if (ranchId) {
    return res.json(dbStore.weatherSnapshots.filter((w: WeatherSnapshot) => w.ranchId === ranchId));
  }
  res.json(dbStore.weatherSnapshots);
});

router.get('/irrigation-events', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.irrigationEvents.filter((ie: IrrigationEvent) => ie.fieldId === fieldId));
  }
  res.json(dbStore.irrigationEvents);
});

router.post('/irrigation-events', validateBody(createIrrigationEventSchema), (req, res) => {
  const newEvent = {
    status: 'scheduled',
    ...req.body,
    id: crypto.randomUUID()
  };
  dbStore.irrigationEvents.push(newEvent);
  res.status(201).json(newEvent);
});

router.patch('/irrigation-events/:id', validateBody(updateIrrigationEventSchema), (req, res) => {
  const event = dbStore.irrigationEvents.find(ie => ie.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Irrigation event not found' });
  }

  const { id, ...updates } = req.body;
  Object.assign(event, updates);
  res.json(event);
});

router.get('/soil-moisture', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.soilMoistureReadings.filter((sm: SoilMoistureReading) => sm.fieldId === fieldId));
  }
  res.json(dbStore.soilMoistureReadings);
});

export default router;
