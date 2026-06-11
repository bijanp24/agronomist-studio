import { z } from 'zod';

export const createSessionSchema = z.object({
  sourceSystem: z.string().min(1, 'sourceSystem is required'),
});

export const mappingSchema = z.object({
  sourceColumn: z.string(),
  canonicalField: z.string(),
});

export const csvImportSchema = z.object({
  importId: z.string().min(1, 'importId is required'),
  csvText: z.string().min(1, 'csvText is required'),
  defaultFarmId: z.string().optional(),
  mappings: z.array(mappingSchema).optional(),
});

export const geoJsonImportSchema = z.object({
  importId: z.string().min(1, 'importId is required'),
  geojson: z.any({ required_error: 'geojson is required' }),
  defaultFarmId: z.string().optional(),
});

export const commitImportSchema = z.object({
  importId: z.string().min(1, 'importId is required'),
  defaultRanchId: z.string().optional(),
});
