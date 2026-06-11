import { Router } from 'express';
import { dbStore } from '../services/store.service';
import { SoilSample, TissueSample, NitrogenPlan } from 'shared';

const router = Router();

router.get('/soil-samples', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.soilSamples.filter((s: SoilSample) => s.fieldId === fieldId));
  }
  res.json(dbStore.soilSamples);
});

router.get('/tissue-samples', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.tissueSamples.filter((t: TissueSample) => t.fieldId === fieldId));
  }
  res.json(dbStore.tissueSamples);
});

router.get('/nitrogen-plans', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.nitrogenPlans.filter((np: NitrogenPlan) => np.fieldId === fieldId));
  }
  res.json(dbStore.nitrogenPlans);
});

export default router;
