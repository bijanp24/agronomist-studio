CREATE TABLE "crop_seasons" (
	"id" text PRIMARY KEY,
	"field_id" text NOT NULL,
	"crop_year" integer NOT NULL,
	"crop_name" text NOT NULL,
	"variety" text
);
--> statement-breakpoint
CREATE TABLE "fields" (
	"id" text PRIMARY KEY,
	"ranch_id" text NOT NULL,
	"name" text NOT NULL,
	"crop" text NOT NULL,
	"variety" text,
	"area_acres" double precision NOT NULL,
	"county" text NOT NULL,
	"status" text NOT NULL,
	"last_scouted" timestamp,
	"boundary_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "harvest_records" (
	"id" text PRIMARY KEY,
	"field_id" text NOT NULL,
	"harvest_date" text NOT NULL,
	"crop_year" integer NOT NULL,
	"crop" text NOT NULL,
	"variety" text,
	"total_yield_amount" double precision NOT NULL,
	"yield_unit" text NOT NULL,
	"quality_grade" text,
	"operator_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_errors" (
	"id" serial PRIMARY KEY,
	"import_id" text NOT NULL,
	"row" text NOT NULL,
	"field" text NOT NULL,
	"message" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" text PRIMARY KEY,
	"source_system" text NOT NULL,
	"status" text NOT NULL,
	"blob_key" text,
	"created_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"conflicted_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_staging_fields" (
	"id" text PRIMARY KEY,
	"import_id" text NOT NULL,
	"farm_id" text,
	"name" text,
	"boundary" jsonb,
	"area_value" double precision,
	"area_unit" text,
	"raw_source_id" text,
	"source_system" text
);
--> statement-breakpoint
CREATE TABLE "import_staging_operations" (
	"id" text PRIMARY KEY,
	"import_id" text NOT NULL,
	"field_id" text,
	"season_id" text,
	"operation_type" text,
	"date" text,
	"source_system" text,
	"raw_source_id" text,
	"measurements" jsonb,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "import_staging_seasons" (
	"id" text PRIMARY KEY,
	"import_id" text NOT NULL,
	"field_id" text,
	"crop_year" integer,
	"crop_name" text,
	"variety" text
);
--> statement-breakpoint
CREATE TABLE "irrigation_events" (
	"id" text PRIMARY KEY,
	"field_id" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp NOT NULL,
	"duration_hours" double precision NOT NULL,
	"applied_inches" double precision NOT NULL,
	"gallons_applied" double precision NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" serial PRIMARY KEY,
	"job_name" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp,
	"status" text NOT NULL,
	"summary" jsonb,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "nitrogen_plans" (
	"id" text PRIMARY KEY,
	"field_id" text NOT NULL,
	"crop_year" integer NOT NULL,
	"budgeted_n_lbs_per_acre" double precision NOT NULL,
	"applied_n_lbs_per_acre" double precision NOT NULL,
	"organic_n_lbs_per_acre" double precision NOT NULL,
	"irrigation_n_lbs_per_acre" double precision NOT NULL,
	"yield_goal_tons_per_acre" double precision NOT NULL,
	"credits_residual_n_lbs_per_acre" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planting_plans" (
	"id" text PRIMARY KEY,
	"field_id" text NOT NULL,
	"crop_year" integer NOT NULL,
	"crop" text NOT NULL,
	"variety" text,
	"target_planting_date" text NOT NULL,
	"actual_planting_date" text,
	"target_harvest_date" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ranches" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"owner_id" text,
	"county" text NOT NULL,
	"total_acres" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scouting_reports" (
	"id" text PRIMARY KEY,
	"field_id" text NOT NULL,
	"scouter_name" text NOT NULL,
	"scouted_at" timestamp NOT NULL,
	"severity" text NOT NULL,
	"notes" text NOT NULL,
	"pest_observations" jsonb NOT NULL,
	"crop_stage" text NOT NULL,
	"location_pin" jsonb,
	"images" jsonb
);
--> statement-breakpoint
CREATE TABLE "soil_moisture_readings" (
	"id" text PRIMARY KEY,
	"field_id" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"depth_8_inches_pct" double precision NOT NULL,
	"depth_16_inches_pct" double precision NOT NULL,
	"depth_32_inches_pct" double precision NOT NULL,
	"average_pct" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soil_samples" (
	"id" text PRIMARY KEY,
	"field_id" text NOT NULL,
	"sample_date" text NOT NULL,
	"lab_sample_number" text NOT NULL,
	"nitrogen_ppm" double precision NOT NULL,
	"phosphorus_ppm" double precision NOT NULL,
	"potassium_ppm" double precision NOT NULL,
	"organic_matter_pct" double precision NOT NULL,
	"ph" double precision NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tissue_samples" (
	"id" text PRIMARY KEY,
	"field_id" text NOT NULL,
	"sample_date" text NOT NULL,
	"nitrogen_pct" double precision NOT NULL,
	"phosphorus_pct" double precision NOT NULL,
	"potassium_pct" double precision NOT NULL,
	"zinc_ppm" double precision NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weather_snapshots" (
	"id" text PRIMARY KEY,
	"ranch_id" text NOT NULL,
	"date" text NOT NULL,
	"temp_min_f" double precision NOT NULL,
	"temp_max_f" double precision NOT NULL,
	"humidity_pct" double precision NOT NULL,
	"wind_speed_mph" double precision NOT NULL,
	"cimis_eto_inches" double precision NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crop_seasons" ADD CONSTRAINT "crop_seasons_field_id_fields_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "fields" ADD CONSTRAINT "fields_ranch_id_ranches_id_fkey" FOREIGN KEY ("ranch_id") REFERENCES "ranches"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "harvest_records" ADD CONSTRAINT "harvest_records_field_id_fields_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "import_errors" ADD CONSTRAINT "import_errors_import_id_import_jobs_id_fkey" FOREIGN KEY ("import_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "import_staging_fields" ADD CONSTRAINT "import_staging_fields_import_id_import_jobs_id_fkey" FOREIGN KEY ("import_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "import_staging_operations" ADD CONSTRAINT "import_staging_operations_import_id_import_jobs_id_fkey" FOREIGN KEY ("import_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "import_staging_seasons" ADD CONSTRAINT "import_staging_seasons_import_id_import_jobs_id_fkey" FOREIGN KEY ("import_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "irrigation_events" ADD CONSTRAINT "irrigation_events_field_id_fields_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "nitrogen_plans" ADD CONSTRAINT "nitrogen_plans_field_id_fields_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "planting_plans" ADD CONSTRAINT "planting_plans_field_id_fields_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scouting_reports" ADD CONSTRAINT "scouting_reports_field_id_fields_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "soil_moisture_readings" ADD CONSTRAINT "soil_moisture_readings_field_id_fields_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "soil_samples" ADD CONSTRAINT "soil_samples_field_id_fields_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "tissue_samples" ADD CONSTRAINT "tissue_samples_field_id_fields_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_ranch_id_ranches_id_fkey" FOREIGN KEY ("ranch_id") REFERENCES "ranches"("id") ON DELETE CASCADE;