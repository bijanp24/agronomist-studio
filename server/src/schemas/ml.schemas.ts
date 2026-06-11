import { z } from 'zod';

export const predictSchema = z.object({
  field_id: z.string().min(1, 'field_id is required'),
  crop_name: z.string().min(1, 'crop_name is required'),
});

export const historyParamsSchema = z.object({
  fieldId: z.string().min(1, 'fieldId param is required'),
});

export const optimizeSchema = z.object({
  field_id: z.string().min(1, 'field_id is required'),
  irrigation_in: z.number().optional(),
  nitrogen_lb_ac: z.number().optional(),
});

export const assessSchema = z.object({
  field_id: z.string().min(1, 'field_id is required'),
});

export const compareSchema = z.object({
  field_id: z.string().min(1, 'field_id is required'),
});

export const trainParamsSchema = z.object({
  mtype: z.enum(['yield', 'risk', 'cluster']),
});
