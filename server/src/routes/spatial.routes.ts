import { Router, Request, Response, NextFunction } from 'express';
import {
  runBoundaryAreaBlock,
  runTerrainFlowBlock,
  runCarryingCapacityBlock,
} from '../services/spatial.service';
import { DEMO_FIELD_DATA } from '../services/demo-field.data';
import { validateBody } from '../middleware/validation.middleware';
import {
  boundaryAreaSchema,
  terrainFlowSchema,
  carryingCapacitySchema,
} from '../schemas/spatial.schemas';

const router = Router();

// Route: POST /api/spatial/boundary-area
router.post(
  '/spatial/boundary-area',
  validateBody(boundaryAreaSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ring, unit } = req.body;
      const result = runBoundaryAreaBlock(ring, unit ?? 'acre');
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Route: POST /api/spatial/terrain-flow
router.post(
  '/spatial/terrain-flow',
  validateBody(terrainFlowSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const grid = req.body;
      const result = runTerrainFlowBlock(grid);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Route: POST /api/spatial/carrying-capacity
router.post(
  '/spatial/carrying-capacity',
  validateBody(carryingCapacitySchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = runCarryingCapacityBlock(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Route: GET /api/spatial/demo
router.get('/spatial/demo', (req: Request, res: Response) => {
  res.json(DEMO_FIELD_DATA);
});

// Route: GET /api/spatial/health
router.get('/spatial/health', (req: Request, res: Response) => {
  res.json({
    service: 'spatial-engine',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
