import { z } from 'zod';

// GeoJSON Schemas
const positionSchema = z.array(z.number()).min(2).max(3);

const polygonGeometrySchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(positionSchema))
});

const pointGeometrySchema = z.object({
  type: z.literal('Point'),
  coordinates: positionSchema
});

// Field Validation Schemas
export const createFieldSchema = z.object({
  ranchId: z.string().uuid('ranchId must be a valid UUID') .or(z.string().min(1, 'ranchId is required')),
  name: z.string().min(1, 'Field name is required'),
  crop: z.string().min(1, 'Crop type is required'),
  variety: z.string().optional(),
  areaAcres: z.number().positive('Acreage must be a positive number'),
  county: z.string().min(1, 'County is required'),
  status: z.enum(['healthy', 'needs-attention', 'critical']),
  boundaryJson: polygonGeometrySchema.optional()
});

// Scouting Report Validation Schemas
const pestObservationSummarySchema = z.object({
  pestName: z.string().min(1, 'Pest name is required'),
  countPerLeaf: z.number().nonnegative().optional(),
  percentInfestation: z.number().min(0).max(100).optional()
});

export const createScoutingReportSchema = z.object({
  fieldId: z.string().min(1, 'fieldId is required'),
  scouterName: z.string().min(1, 'Scouter name is required'),
  severity: z.enum(['low', 'medium', 'high']),
  notes: z.string().default(''),
  pestObservations: z.array(pestObservationSummarySchema).default([]),
  cropStage: z.string().min(1, 'Crop stage is required'),
  locationPin: pointGeometrySchema.optional(),
  images: z.array(z.string()).optional()
});

// Irrigation Event Validation Schemas
export const createIrrigationEventSchema = z.object({
  fieldId: z.string().min(1, 'fieldId is required'),
  startedAt: z.string().datetime({ message: 'startedAt must be an ISO date string' }),
  endedAt: z.string().datetime({ message: 'endedAt must be an ISO date string' }),
  durationHours: z.number().positive('Duration must be greater than zero'),
  appliedInches: z.number().positive('Applied inches must be greater than zero'),
  gallonsApplied: z.number().nonnegative('Gallons applied cannot be negative'),
  status: z.enum(['scheduled', 'active', 'completed']).optional()
});

export const updateIrrigationEventSchema = z.object({
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  durationHours: z.number().positive().optional(),
  appliedInches: z.number().positive().optional(),
  gallonsApplied: z.number().nonnegative().optional(),
  status: z.enum(['scheduled', 'active', 'completed']).optional()
});

// Spray Recommendation Schemas
const materialSchema = z.object({
  tradeName: z.string().min(1, 'Trade name is required'),
  epaRegNumber: z.string().min(1, 'EPA Reg Number is required'),
  ratePerAcre: z.string().min(1, 'Rate per acre is required'),
  activeIngredient: z.string().min(1, 'Active ingredient is required'),
  reiHours: z.number().nonnegative(),
  phiDays: z.number().nonnegative()
});

export const createSprayRecommendationSchema = z.object({
  fieldId: z.string().min(1, 'fieldId is required'),
  pcaName: z.string().min(1, 'PCA Name is required'),
  pcaLicense: z.string().min(1, 'PCA License is required'),
  pestTarget: z.string().min(1, 'Pest target is required'),
  materials: z.array(materialSchema).min(1, 'At least one material is required'),
  waterVolumeGallonsPerAcre: z.number().positive('Water volume must be positive'),
  totalTreatedAcres: z.number().positive('Total treated acres must be positive'),
  applicationMethod: z.enum(['ground', 'air']),
  status: z.enum(['draft', 'approved', 'applied']).optional()
});

export const updateSprayRecommendationSchema = z.object({
  pcaName: z.string().optional(),
  pcaLicense: z.string().optional(),
  pestTarget: z.string().optional(),
  materials: z.array(materialSchema).optional(),
  waterVolumeGallonsPerAcre: z.number().positive().optional(),
  totalTreatedAcres: z.number().positive().optional(),
  applicationMethod: z.enum(['ground', 'air']).optional(),
  status: z.enum(['draft', 'approved', 'applied']).optional(),
  approvedAt: z.string().datetime().optional(),
  appliedAt: z.string().datetime().optional()
});

// Pesticide Use Report Schemas
export const createPesticideUseReportSchema = z.object({
  fieldId: z.string().min(1, 'fieldId is required'),
  recommendationId: z.string().optional(),
  operatorName: z.string().min(1, 'Operator name is required'),
  permitNumber: z.string().min(1, 'Permit number is required'),
  countyCode: z.string().min(1, 'County code is required'),
  applicationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  materialName: z.string().min(1, 'Material name is required'),
  epaRegNumber: z.string().min(1, 'EPA registration number is required'),
  totalAmountApplied: z.number().positive('Total amount must be positive'),
  unit: z.enum(['lbs', 'gals', 'oz']),
  treatedAcres: z.number().positive('Treated acres must be positive'),
  status: z.enum(['pending-submission', 'submitted']).optional()
});

// Agronomy Gateway Schemas
export const agronomyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  cropId: z.string().optional(),
  crop: z.string().optional(),
  efficiency: z.coerce.number().min(0).max(1).optional(),
  eto: z.coerce.number().positive().optional()
});

export const agronomySearchSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  cropId: z.string().optional(),
  cropName: z.string().optional(),
  systemEfficiency: z.number().min(0).max(1).optional(),
  etoOverride: z.number().positive().optional()
});

