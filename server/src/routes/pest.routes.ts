import { Router } from 'express';
import { dbStore } from '../services/store.service';
import { validateBody } from '../middleware/validation.middleware';
import { PestObservation } from 'shared';
import {
  createSprayRecommendationSchema,
  updateSprayRecommendationSchema,
  createPesticideUseReportSchema
} from '../schemas/agronomy.schemas';
import crypto from 'crypto';

const router = Router();

router.get('/pest-observations', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.pestObservations.filter((po: PestObservation) => po.fieldId === fieldId));
  }
  res.json(dbStore.pestObservations);
});

router.get('/spray-recommendations', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.sprayRecommendations.filter(rec => rec.fieldId === fieldId));
  }
  res.json(dbStore.sprayRecommendations);
});

router.post('/spray-recommendations', validateBody(createSprayRecommendationSchema), (req, res) => {
  const newRec = {
    status: 'draft',
    ...req.body,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  dbStore.sprayRecommendations.push(newRec);
  res.status(201).json(newRec);
});

router.patch('/spray-recommendations/:id', validateBody(updateSprayRecommendationSchema), (req, res) => {
  const rec = dbStore.sprayRecommendations.find(r => r.id === req.params.id);
  if (!rec) {
    return res.status(404).json({ error: 'Spray recommendation not found' });
  }

  const { id, createdAt, ...updates } = req.body;
  Object.assign(rec, updates);
  res.json(rec);
});

router.get('/pesticide-use-reports', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.pesticideUseReports.filter(pur => pur.fieldId === fieldId));
  }
  res.json(dbStore.pesticideUseReports);
});

router.post('/pesticide-use-reports', validateBody(createPesticideUseReportSchema), (req, res) => {
  const newPur = {
    status: 'pending-submission',
    ...req.body,
    id: crypto.randomUUID()
  };
  dbStore.pesticideUseReports.push(newPur);
  res.status(201).json(newPur);
});

export default router;
