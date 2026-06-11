import { Router } from 'express';
import { dbStore } from '../services/store.service';
import { validateBody } from '../middleware/validation.middleware';
import { createScoutingReportSchema } from '../schemas/agronomy.schemas';
import crypto from 'crypto';

const router = Router();

router.get('/scouting-reports', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.scoutingReports.filter(r => r.fieldId === fieldId));
  }
  res.json(dbStore.scoutingReports);
});

router.get('/scouting-reports/:id', (req, res) => {
  const report = dbStore.scoutingReports.find(r => r.id === req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Scouting report not found' });
  }
  res.json(report);
});

router.post('/scouting-reports', validateBody(createScoutingReportSchema), (req, res) => {
  const newReport = {
    ...req.body,
    id: crypto.randomUUID(),
    scoutedAt: new Date().toISOString()
  };
  dbStore.scoutingReports.push(newReport);

  // Update lastScouted on field
  const field = dbStore.fields.find(f => f.id === newReport.fieldId);
  if (field) {
    field.lastScouted = newReport.scoutedAt;
  }

  res.status(201).json(newReport);
});

export default router;
