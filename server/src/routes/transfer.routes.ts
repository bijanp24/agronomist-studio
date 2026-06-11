import { Router, Request, Response, NextFunction } from 'express';
import { transferService } from '../services/transfer.service';
import { dbStore } from '../services/store.service';
import { validateBody, validateParams } from '../middleware/validation.middleware';
import {
  createSessionSchema,
  csvImportSchema,
  geoJsonImportSchema,
  commitImportSchema,
} from '../schemas/transfer.schemas';
import { z } from 'zod';

const router = Router();

// Route: GET /api/transfer/health
router.get('/transfer/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    total_cached_sessions: dbStore.fields.length,
    supported_formats: ['csv', 'geojson'],
  });
});

// Route: POST /api/transfer/session
router.post(
  '/transfer/session',
  validateBody(createSessionSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sourceSystem } = req.body;
      const session = transferService.createSession(sourceSystem);
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  }
);

// Route: POST /api/transfer/suggest-mappings
router.post(
  '/transfer/suggest-mappings',
  validateBody(z.object({ headers: z.array(z.string()) })),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { headers } = req.body;
      const mappings = transferService.suggestColumnMappings(headers);
      res.json(mappings);
    } catch (error) {
      next(error);
    }
  }
);

// Route: POST /api/transfer/import/csv
router.post(
  '/transfer/import/csv',
  validateBody(csvImportSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { importId, csvText, defaultFarmId, mappings } = req.body;
      
      // Default to the first ranch in dbStore if not provided
      const farmId = defaultFarmId || (dbStore.ranches[0] ? dbStore.ranches[0].id : 'ranch-1');

      const updatedSession = transferService.processCsvImport(importId, csvText, farmId, mappings);
      res.json(updatedSession);
    } catch (error) {
      next(error);
    }
  }
);

// Route: POST /api/transfer/import/geojson
router.post(
  '/transfer/import/geojson',
  validateBody(geoJsonImportSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { importId, geojson, defaultFarmId } = req.body;
      
      const farmId = defaultFarmId || (dbStore.ranches[0] ? dbStore.ranches[0].id : 'ranch-1');

      const updatedSession = transferService.processGeoJsonImport(importId, geojson, farmId);
      res.json(updatedSession);
    } catch (error) {
      next(error);
    }
  }
);

// Route: GET /api/transfer/preview/:importId
router.get(
  '/transfer/preview/:importId',
  validateParams(z.object({ importId: z.string() })),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { importId } = req.params;
      const session = transferService.getSession(importId);
      if (!session) {
        res.status(404).json({ message: `Import session ${importId} not found` });
        return;
      }
      res.json(session);
    } catch (error) {
      next(error);
    }
  }
);

// Route: POST /api/transfer/commit
router.post(
  '/transfer/commit',
  validateBody(commitImportSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { importId, defaultRanchId } = req.body;
      
      const ranchId = defaultRanchId || (dbStore.ranches[0] ? dbStore.ranches[0].id : 'ranch-1');

      const result = transferService.commitSession(importId, ranchId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export { router as transferRouter };
