import { Router } from 'express';
import { dbStore } from '../services/store.service';
import { validateBody } from '../middleware/validation.middleware';
import { createFieldSchema } from '../schemas/agronomy.schemas';
import crypto from 'crypto';

const router = Router();

router.get('/ranches', (req, res) => {
  res.json(dbStore.ranches);
});

router.get('/fields', (req, res) => {
  const { ranchId } = req.query;
  if (ranchId) {
    return res.json(dbStore.fields.filter(f => f.ranchId === ranchId));
  }
  res.json(dbStore.fields);
});

router.get('/fields/:id', (req, res) => {
  const field = dbStore.fields.find(f => f.id === req.params.id);
  if (!field) {
    return res.status(404).json({ error: 'Field not found' });
  }
  res.json(field);
});

router.post('/fields', validateBody(createFieldSchema), (req, res) => {
  const newField = {
    ...req.body,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  dbStore.fields.push(newField);
  res.status(201).json(newField);
});

export default router;
