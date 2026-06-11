import { z } from 'zod';

export const latLonSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const boundaryAreaSchema = z.object({
  ring: z.array(latLonSchema).min(3, 'A ring must have at least 3 points'),
  unit: z.enum(['acre', 'hectare']).optional(),
});

export const terrainFlowSchema = z.object({
  values: z.array(z.array(z.number())),
  cellSizeMeters: z.number().positive(),
  originLat: z.number().min(-90).max(90),
  originLon: z.number().min(-180).max(180),
});

export const logisticSchema = z.object({
  initialPopulation: z.number().nonnegative(),
  carryingCapacity: z.number().positive(),
  growthRate: z.number().positive(),
  steps: z.number().int().positive(),
  stepSize: z.number().positive().optional(),
});

export const lotkaVolterraSchema = z.object({
  preyPopulation: z.number().nonnegative(),
  predatorPopulation: z.number().nonnegative(),
  alpha: z.number().positive(),
  beta: z.number().positive(),
  delta: z.number().positive(),
  gamma: z.number().positive(),
  steps: z.number().int().positive(),
  stepSize: z.number().positive().optional(),
});

export const carryingCapacitySchema = z.object({
  mode: z.enum(['logistic', 'predator-prey']),
  logistic: logisticSchema.optional(),
  lotkaVolterra: lotkaVolterraSchema.optional(),
});
