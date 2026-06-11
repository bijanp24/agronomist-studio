import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createLogger } from '../services/agronomy/http';
import {
  buildLocationSummary,
  buildIrrigationRecommendation,
  buildSoilWaterBalance,
  buildRiskSummary
} from '../services/agronomy/gateway';
import { validateQuery, validateBody } from '../middleware/validation.middleware';
import { agronomyQuerySchema, agronomySearchSchema } from '../schemas/agronomy.schemas';
import { GeoPoint } from '../services/agronomy/models';

const router = Router();
const SERVICE = 'agronomy-gateway';

// Route: GET /api/agronomy/location-summary
router.get(
  '/agronomy/location-summary',
  validateQuery(agronomyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    const logger = createLogger(SERVICE, requestId).child({
      route: '/api/agronomy/location-summary',
      method: 'GET'
    });
    
    try {
      const { lat, lon, cropId, crop, efficiency } = req.query as any;
      const point: GeoPoint = { latitude: lat, longitude: lon };
      
      const summary = await buildLocationSummary(
        point,
        {
          cropId: cropId,
          cropName: crop,
          systemEfficiency: efficiency
        },
        logger
      );
      
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

// Route: POST /api/agronomy/search
router.post(
  '/agronomy/search',
  validateBody(agronomySearchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    const logger = createLogger(SERVICE, requestId).child({
      route: '/api/agronomy/search',
      method: 'POST'
    });

    try {
      const { latitude, longitude, cropId, cropName, systemEfficiency } = req.body;
      const point: GeoPoint = { latitude, longitude };

      const summary = await buildLocationSummary(
        point,
        {
          cropId,
          cropName,
          systemEfficiency
        },
        logger
      );

      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

// Route: GET /api/agronomy/irrigation-recommendation
router.get(
  '/agronomy/irrigation-recommendation',
  validateQuery(agronomyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    const logger = createLogger(SERVICE, requestId).child({
      route: '/api/agronomy/irrigation-recommendation',
      method: 'GET'
    });

    try {
      const { lat, lon, cropId, crop, efficiency, eto } = req.query as any;
      const recommendation = await buildIrrigationRecommendation(
        {
          latitude: lat,
          longitude: lon,
          cropId,
          cropName: crop,
          systemEfficiency: efficiency,
          etoOverride: eto
        },
        logger
      );

      res.json(recommendation);
    } catch (error) {
      next(error);
    }
  }
);

// Route: POST /api/agronomy/irrigation-recommendation
router.post(
  '/agronomy/irrigation-recommendation',
  validateBody(agronomySearchSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    const logger = createLogger(SERVICE, requestId).child({
      route: '/api/agronomy/irrigation-recommendation',
      method: 'POST'
    });

    try {
      const { latitude, longitude, cropId, cropName, systemEfficiency, etoOverride } = req.body;
      const recommendation = await buildIrrigationRecommendation(
        {
          latitude,
          longitude,
          cropId,
          cropName,
          systemEfficiency,
          etoOverride
        },
        logger
      );

      res.json(recommendation);
    } catch (error) {
      next(error);
    }
  }
);

// Route: GET /api/agronomy/soil-water-balance
router.get(
  '/agronomy/soil-water-balance',
  validateQuery(agronomyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    const logger = createLogger(SERVICE, requestId).child({
      route: '/api/agronomy/soil-water-balance',
      method: 'GET'
    });

    try {
      const { lat, lon } = req.query as any;
      const point: GeoPoint = { latitude: lat, longitude: lon };

      const balance = await buildSoilWaterBalance(point, logger);
      res.json(balance);
    } catch (error) {
      next(error);
    }
  }
);

// Route: GET /api/agronomy/risk-summary
router.get(
  '/agronomy/risk-summary',
  validateQuery(agronomyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    const logger = createLogger(SERVICE, requestId).child({
      route: '/api/agronomy/risk-summary',
      method: 'GET'
    });

    try {
      const { lat, lon } = req.query as any;
      const point: GeoPoint = { latitude: lat, longitude: lon };

      const risk = await buildRiskSummary(point, logger);
      res.json(risk);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
