import { Router, Request, Response, NextFunction } from 'express';
import {
  computeMockYield,
  computeMockOptimize,
  computeMockRiskSummary,
  computeMockBenchmark,
  MOCK_CLUSTERS,
  computeMockFieldHistory,
} from '../services/ml.service';
import {
  validateBody,
  validateParams,
} from '../middleware/validation.middleware';
import {
  predictSchema,
  historyParamsSchema,
  optimizeSchema,
  assessSchema,
  compareSchema,
  trainParamsSchema,
} from '../schemas/ml.schemas';

const router = Router();

// Route: GET /api/ml/health
router.get('/ml/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    demo_mode: true,
    active_models: { yield: 'demo-v1', risk: 'demo-v1', cluster: 'demo-v1' },
  });
});

// Route: POST /api/ml/yield/predict
router.post(
  '/ml/yield/predict',
  validateBody(predictSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { field_id, crop_name } = req.body;
      const prediction = computeMockYield(field_id, crop_name);
      res.json(prediction);
    } catch (error) {
      next(error);
    }
  }
);

// Route: GET /api/ml/yield/history/:fieldId
router.get(
  '/ml/yield/history/:fieldId',
  validateParams(historyParamsSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fieldId } = req.params;
      // Crop name fallback: let's query the request for crop name or use a sensible fallback (almond)
      const cropName = (req.query.crop as string) || 'Almond';
      const history = computeMockFieldHistory(fieldId, cropName);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
);

// Route: POST /api/ml/optimize/inputs
router.post(
  '/ml/optimize/inputs',
  validateBody(optimizeSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { field_id, irrigation_in, nitrogen_lb_ac } = req.body;
      const optimization = computeMockOptimize(field_id, irrigation_in, nitrogen_lb_ac);
      res.json(optimization);
    } catch (error) {
      next(error);
    }
  }
);

// Route: POST /api/ml/risk/assess
router.post(
  '/ml/risk/assess',
  validateBody(assessSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { field_id } = req.body;
      const risks = computeMockRiskSummary();
      const assessment = risks.find((r) => r.field_id === field_id) || {
        field_id,
        crop_year: 2026,
        anomaly_score: 0.25,
        risk_label: 'low' as const,
        residual_zscore: 0.5,
        top_risk_factors: [],
        cohort_id: 1,
        cohort_name: 'Mixed cohort 1',
        explanation: 'Risk assessment: low (anomaly score 0.25). No substantial anomalies found.',
        disclaimer: 'Deterministic mock.',
      };
      res.json(assessment);
    } catch (error) {
      next(error);
    }
  }
);

// Route: GET /api/ml/risk/summary
router.get('/ml/risk/summary', (req: Request, res: Response, next: NextFunction) => {
  try {
    const fields = computeMockRiskSummary();
    res.json({ crop_year: 2026, fields });
  } catch (error) {
    next(error);
  }
});

// Route: POST /api/ml/benchmark/compare
router.post(
  '/ml/benchmark/compare',
  validateBody(compareSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { field_id } = req.body;
      const benchmark = computeMockBenchmark(field_id);
      res.json(benchmark);
    } catch (error) {
      next(error);
    }
  }
);

// Route: GET /api/ml/benchmark/clusters
router.get('/ml/benchmark/clusters', (req: Request, res: Response) => {
  res.json({ clusters: MOCK_CLUSTERS });
});

// Route: POST /api/ml/train/:mtype
router.post(
  '/ml/train/:mtype',
  validateParams(trainParamsSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mtype } = req.params;
      res.json({
        status: 'ok',
        results: {
          [mtype]: {
            training_rows: 300,
            r2_score: 0.89,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
