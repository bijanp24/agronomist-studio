import { pgTable, text, timestamp, doublePrecision, integer, serial, jsonb } from 'drizzle-orm/pg-core';

// 1. Ranches
export const ranches = pgTable('ranches', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  ownerId: text('owner_id'),
  county: text('county').notNull(),
  totalAcres: doublePrecision('total_acres').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Fields
export const fields = pgTable('fields', {
  id: text('id').primaryKey(),
  ranchId: text('ranch_id').notNull().references(() => ranches.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  crop: text('crop').notNull(),
  variety: text('variety'),
  areaAcres: doublePrecision('area_acres').notNull(),
  county: text('county').notNull(),
  status: text('status').notNull(), // 'healthy' | 'needs-attention' | 'critical'
  lastScouted: timestamp('last_scouted'),
  boundaryJson: jsonb('boundary_json'), // GeoJSON Polygon
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Crop Seasons
export const cropSeasons = pgTable('crop_seasons', {
  id: text('id').primaryKey(),
  fieldId: text('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  cropYear: integer('crop_year').notNull(),
  cropName: text('crop_name').notNull(),
  variety: text('variety'),
});

// 4. Planting Plans
export const plantingPlans = pgTable('planting_plans', {
  id: text('id').primaryKey(),
  fieldId: text('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  cropYear: integer('crop_year').notNull(),
  crop: text('crop').notNull(),
  variety: text('variety'),
  targetPlantingDate: text('target_planting_date').notNull(), // YYYY-MM-DD
  actualPlantingDate: text('actual_planting_date'), // YYYY-MM-DD
  targetHarvestDate: text('target_harvest_date').notNull(), // YYYY-MM-DD
  status: text('status').notNull(), // 'planned' | 'planted' | 'harvested' | 'cancelled'
});

// 5. Harvest Records
export const harvestRecords = pgTable('harvest_records', {
  id: text('id').primaryKey(),
  fieldId: text('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  harvestDate: text('harvest_date').notNull(), // YYYY-MM-DD
  cropYear: integer('crop_year').notNull(),
  crop: text('crop').notNull(),
  variety: text('variety'),
  totalYieldAmount: doublePrecision('total_yield_amount').notNull(),
  yieldUnit: text('yield_unit').notNull(), // 'tons' | 'lbs' | 'bins'
  qualityGrade: text('quality_grade'),
  operatorName: text('operator_name').notNull(),
});

// 6. Irrigation Events
export const irrigationEvents = pgTable('irrigation_events', {
  id: text('id').primaryKey(),
  fieldId: text('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at').notNull(),
  durationHours: doublePrecision('duration_hours').notNull(),
  appliedInches: doublePrecision('applied_inches').notNull(),
  gallonsApplied: doublePrecision('gallons_applied').notNull(),
  status: text('status').notNull(), // 'scheduled' | 'active' | 'completed'
});

// 7. Soil Moisture Readings
export const soilMoistureReadings = pgTable('soil_moisture_readings', {
  id: text('id').primaryKey(),
  fieldId: text('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').notNull(),
  depth8InchesPct: doublePrecision('depth_8_inches_pct').notNull(),
  depth16InchesPct: doublePrecision('depth_16_inches_pct').notNull(),
  depth32InchesPct: doublePrecision('depth_32_inches_pct').notNull(),
  averagePct: doublePrecision('average_pct').notNull(),
});

// 8. Weather Snapshots
export const weatherSnapshots = pgTable('weather_snapshots', {
  id: text('id').primaryKey(),
  ranchId: text('ranch_id').notNull().references(() => ranches.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  tempMinF: doublePrecision('temp_min_f').notNull(),
  tempMaxF: doublePrecision('temp_max_f').notNull(),
  humidityPct: doublePrecision('humidity_pct').notNull(),
  windSpeedMph: doublePrecision('wind_speed_mph').notNull(),
  cimisEtoInches: doublePrecision('cimis_eto_inches').notNull(),
});

// 9. Scouting Reports
export const scoutingReports = pgTable('scouting_reports', {
  id: text('id').primaryKey(),
  fieldId: text('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  scouterName: text('scouter_name').notNull(),
  scoutedAt: timestamp('scouted_at').notNull(),
  severity: text('severity').notNull(), // 'low' | 'medium' | 'high'
  notes: text('notes').notNull(),
  pestObservations: jsonb('pest_observations').notNull(), // PestObservationSummary[]
  cropStage: text('crop_stage').notNull(),
  locationPin: jsonb('location_pin'), // GeoJSON Point
  images: jsonb('images'), // string[]
});

// 10. Soil Samples
export const soilSamples = pgTable('soil_samples', {
  id: text('id').primaryKey(),
  fieldId: text('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  sampleDate: text('sample_date').notNull(), // YYYY-MM-DD
  labSampleNumber: text('lab_sample_number').notNull(),
  nitrogenPpm: doublePrecision('nitrogen_ppm').notNull(),
  phosphorusPpm: doublePrecision('phosphorus_ppm').notNull(),
  potassiumPpm: doublePrecision('potassium_ppm').notNull(),
  organicMatterPct: doublePrecision('organic_matter_pct').notNull(),
  ph: doublePrecision('ph').notNull(),
  status: text('status').notNull(), // 'low' | 'optimal' | 'high'
});

// 11. Tissue Samples
export const tissueSamples = pgTable('tissue_samples', {
  id: text('id').primaryKey(),
  fieldId: text('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  sampleDate: text('sample_date').notNull(), // YYYY-MM-DD
  nitrogenPct: doublePrecision('nitrogen_pct').notNull(),
  phosphorusPct: doublePrecision('phosphorus_pct').notNull(),
  potassiumPct: doublePrecision('potassium_pct').notNull(),
  zincPpm: doublePrecision('zinc_ppm').notNull(),
  status: text('status').notNull(), // 'deficient' | 'adequate' | 'excessive'
});

// 12. Nitrogen Plans
export const nitrogenPlans = pgTable('nitrogen_plans', {
  id: text('id').primaryKey(),
  fieldId: text('field_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  cropYear: integer('crop_year').notNull(),
  budgetedN_lbsPerAcre: doublePrecision('budgeted_n_lbs_per_acre').notNull(),
  appliedN_lbsPerAcre: doublePrecision('applied_n_lbs_per_acre').notNull(),
  organicN_lbsPerAcre: doublePrecision('organic_n_lbs_per_acre').notNull(),
  irrigationN_lbsPerAcre: doublePrecision('irrigation_n_lbs_per_acre').notNull(),
  yieldGoalTonsPerAcre: doublePrecision('yield_goal_tons_per_acre').notNull(),
  creditsResidualN_lbsPerAcre: doublePrecision('credits_residual_n_lbs_per_acre').notNull(),
});

// 13. Import Jobs (durable pipeline state)
export const importJobs = pgTable('import_jobs', {
  id: text('id').primaryKey(),
  sourceSystem: text('source_system').notNull(),
  status: text('status').notNull(), // 'pending' | 'processing' | 'validated' | 'failed' | 'committing' | 'committed'
  blobKey: text('blob_key'),
  createdCount: integer('created_count').notNull().default(0),
  updatedCount: integer('updated_count').notNull().default(0),
  skippedCount: integer('skipped_count').notNull().default(0),
  conflictedCount: integer('conflicted_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 14. Import Errors
export const importErrors = pgTable('import_errors', {
  id: serial('id').primaryKey(),
  importId: text('import_id').notNull().references(() => importJobs.id, { onDelete: 'cascade' }),
  row: text('row').notNull(),
  field: text('field').notNull(),
  message: text('message').notNull(),
});

// 15. Import Staging Fields
export const importStagingFields = pgTable('import_staging_fields', {
  id: text('id').primaryKey(),
  importId: text('import_id').notNull().references(() => importJobs.id, { onDelete: 'cascade' }),
  farmId: text('farm_id'),
  name: text('name'),
  boundary: jsonb('boundary'),
  areaValue: doublePrecision('area_value'),
  areaUnit: text('area_unit'),
  rawSourceId: text('raw_source_id'),
  sourceSystem: text('source_system'),
});

// 16. Import Staging Seasons
export const importStagingSeasons = pgTable('import_staging_seasons', {
  id: text('id').primaryKey(),
  importId: text('import_id').notNull().references(() => importJobs.id, { onDelete: 'cascade' }),
  fieldId: text('field_id'),
  cropYear: integer('crop_year'),
  cropName: text('crop_name'),
  variety: text('variety'),
});

// 17. Import Staging Operations
export const importStagingOperations = pgTable('import_staging_operations', {
  id: text('id').primaryKey(),
  importId: text('import_id').notNull().references(() => importJobs.id, { onDelete: 'cascade' }),
  fieldId: text('field_id'),
  seasonId: text('season_id'),
  operationType: text('operation_type'),
  date: text('date'),
  sourceSystem: text('source_system'),
  rawSourceId: text('raw_source_id'),
  measurements: jsonb('measurements'), // TransferMeasurement[]
  notes: text('notes'),
});

// 18. Job Runs (monitoring)
export const jobRuns = pgTable('job_runs', {
  id: serial('id').primaryKey(),
  jobName: text('job_name').notNull(),
  startedAt: timestamp('started_at').notNull(),
  finishedAt: timestamp('finished_at'),
  status: text('status').notNull(), // 'success' | 'failed'
  summary: jsonb('summary'),
  error: text('error'),
});
