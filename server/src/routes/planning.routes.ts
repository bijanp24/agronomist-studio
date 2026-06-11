import { Router } from 'express';
import { dbStore } from '../services/store.service';
import { PlantingPlan, HarvestRecord, YieldRecord } from 'shared';

const router = Router();

router.get('/planting-plans', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.plantingPlans.filter((p: PlantingPlan) => p.fieldId === fieldId));
  }
  res.json(dbStore.plantingPlans);
});

router.get('/harvest-records', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.harvestRecords.filter((h: HarvestRecord) => h.fieldId === fieldId));
  }
  res.json(dbStore.harvestRecords);
});

router.get('/yield-records', (req, res) => {
  const { fieldId } = req.query;
  if (fieldId) {
    return res.json(dbStore.yieldRecords.filter((y: YieldRecord) => y.fieldId === fieldId));
  }
  res.json(dbStore.yieldRecords);
});

export default router;
