-- Seed Ranches
INSERT INTO "ranches" ("id", "name", "owner_id", "county", "total_acres", "created_at") VALUES
('r1', 'Sierra View Ranch', NULL, 'Fresno', 320, '2023-01-15 08:00:00'),
('r2', 'Kern River Ranch', NULL, 'Kern', 640, '2023-03-20 08:00:00'),
('r3', 'Sacramento Delta Ranch', NULL, 'Yolo', 480, '2023-06-10 08:00:00')
ON CONFLICT ("id") DO NOTHING;

-- Seed Fields
INSERT INTO "fields" ("id", "ranch_id", "name", "crop", "variety", "area_acres", "county", "status", "last_scouted", "boundary_json", "created_at") VALUES
('f1', 'r1', 'Sierra Almonds - North', 'Almonds', 'Nonpareil', 80, 'Fresno', 'healthy', '2026-06-08 10:30:00', '{"type": "Polygon", "coordinates": [[[-119.720, 36.810], [-119.710, 36.810], [-119.710, 36.805], [-119.720, 36.805], [-119.720, 36.810]]]}', '2023-01-15 09:00:00'),
('f2', 'r1', 'Sierra Almonds - South', 'Almonds', 'Monterey', 120, 'Fresno', 'needs-attention', '2026-06-09 09:15:00', '{"type": "Polygon", "coordinates": [[[-119.720, 36.803], [-119.705, 36.803], [-119.705, 36.795], [-119.720, 36.795], [-119.720, 36.803]]]}', '2023-01-15 09:15:00'),
('f3', 'r1', 'Sierra Grapes - Block A', 'Wine Grapes', 'Cabernet Sauvignon', 60, 'Fresno', 'healthy', '2026-06-07 14:45:00', '{"type": "Polygon", "coordinates": [[[-119.700, 36.810], [-119.690, 36.810], [-119.690, 36.802], [-119.700, 36.802], [-119.700, 36.810]]]}', '2023-02-10 10:00:00'),
('f4', 'r2', 'Kern Pistachios - West', 'Pistachios', 'Kerman', 160, 'Kern', 'critical', '2026-06-05 08:30:00', '{"type": "Polygon", "coordinates": [[[-119.120, 35.420], [-119.100, 35.420], [-119.100, 35.410], [-119.120, 35.410], [-119.120, 35.420]]]}', '2023-03-20 10:00:00'),
('f5', 'r2', 'Kern Alfalfa - Center Pivot', 'Alfalfa', 'CUF 101', 120, 'Kern', 'healthy', '2026-06-09 16:00:00', '{"type": "Polygon", "coordinates": [[[-119.095, 35.420], [-119.080, 35.420], [-119.080, 35.410], [-119.095, 35.410], [-119.095, 35.420]]]}', '2023-03-20 11:00:00'),
('f6', 'r3', 'Sacramento Tomatoes - Field 10', 'Processing Tomatoes', 'Heinz 1885', 140, 'Yolo', 'healthy', '2026-06-08 09:00:00', '{"type": "Polygon", "coordinates": [[[-121.910, 38.710], [-121.895, 38.710], [-121.895, 38.700], [-121.910, 38.700], [-121.910, 38.710]]]}', '2023-06-10 09:00:00'),
('f7', 'r3', 'Sacramento Tomatoes - Field 12', 'Processing Tomatoes', 'Heinz 8504', 100, 'Yolo', 'needs-attention', '2026-06-06 11:30:00', '{"type": "Polygon", "coordinates": [[[-121.890, 38.710], [-121.880, 38.710], [-121.880, 38.700], [-121.890, 38.700], [-121.890, 38.710]]]}', '2023-06-10 09:30:00')
ON CONFLICT ("id") DO NOTHING;

-- Seed Crop Seasons
INSERT INTO "crop_seasons" ("id", "field_id", "crop_year", "crop_name", "variety") VALUES
('cs1', 'f1', 2026, 'Almonds', 'Nonpareil'),
('cs2', 'f2', 2026, 'Almonds', 'Monterey'),
('cs3', 'f3', 2026, 'Wine Grapes', 'Cabernet Sauvignon'),
('cs4', 'f4', 2026, 'Pistachios', 'Kerman'),
('cs5', 'f5', 2026, 'Alfalfa', 'CUF 101'),
('cs6', 'f6', 2026, 'Processing Tomatoes', 'Heinz 1885'),
('cs7', 'f7', 2026, 'Processing Tomatoes', 'Heinz 8504')
ON CONFLICT ("id") DO NOTHING;

-- Seed Planting Plans
INSERT INTO "planting_plans" ("id", "field_id", "crop_year", "crop", "variety", "target_planting_date", "actual_planting_date", "target_harvest_date", "status") VALUES
('pp1', 'f6', 2026, 'Processing Tomatoes', 'Heinz 1885', '2026-04-15', '2026-04-18', '2026-08-20', 'planted'),
('pp2', 'f7', 2026, 'Processing Tomatoes', 'Heinz 8504', '2026-04-22', '2026-04-23', '2026-08-28', 'planted')
ON CONFLICT ("id") DO NOTHING;

-- Seed Harvest Records
INSERT INTO "harvest_records" ("id", "field_id", "harvest_date", "crop_year", "crop", "variety", "total_yield_amount", "yield_unit", "quality_grade", "operator_name") VALUES
('hr1', 'f6', '2025-08-22', 2025, 'Processing Tomatoes', 'Heinz 1885', 7280, 'tons', 'Choice', 'Delta Harvesting Co.')
ON CONFLICT ("id") DO NOTHING;

-- Seed Irrigation Events
INSERT INTO "irrigation_events" ("id", "field_id", "started_at", "ended_at", "duration_hours", "applied_inches", "gallons_applied", "status") VALUES
('ie1', 'f1', '2026-06-07 20:00:00', '2026-06-08 08:00:00', 12, 0.45, 976000, 'completed'),
('ie2', 'f2', '2026-06-09 06:00:00', '2026-06-09 18:00:00', 12, 0.45, 1464000, 'completed'),
('ie3', 'f4', '2026-06-11 04:00:00', '2026-06-11 22:00:00', 18, 0.65, 2824000, 'scheduled'),
('ie4', 'f6', '2026-06-10 12:00:00', '2026-06-11 00:00:00', 12, 0.50, 1900000, 'active')
ON CONFLICT ("id") DO NOTHING;

-- Seed Soil Moisture Readings
INSERT INTO "soil_moisture_readings" ("id", "field_id", "timestamp", "depth_8_inches_pct", "depth_16_inches_pct", "depth_32_inches_pct", "average_pct") VALUES
('sm1', 'f1', '2026-06-09 12:00:00', 24.5, 28.2, 31.0, 27.9),
('sm2', 'f2', '2026-06-09 12:00:00', 18.2, 22.1, 25.4, 21.9),
('sm3', 'f4', '2026-06-09 12:00:00', 14.1, 18.0, 22.1, 18.1)
ON CONFLICT ("id") DO NOTHING;

-- Seed Weather Snapshots
INSERT INTO "weather_snapshots" ("id", "ranch_id", "date", "temp_min_f", "temp_max_f", "humidity_pct", "wind_speed_mph", "cimis_eto_inches") VALUES
('w1', 'r1', '2026-06-08', 62, 95, 35, 8, 0.28),
('w2', 'r1', '2026-06-09', 65, 98, 30, 11, 0.31),
('w3', 'r2', '2026-06-08', 66, 99, 28, 12, 0.33),
('w4', 'r2', '2026-06-09', 68, 102, 25, 9, 0.35)
ON CONFLICT ("id") DO NOTHING;

-- Seed Scouting Reports
INSERT INTO "scouting_reports" ("id", "field_id", "scouter_name", "scouted_at", "severity", "notes", "pest_observations", "crop_stage", "location_pin", "images") VALUES
('sr1', 'f1', 'John Deere', '2026-06-08 10:30:00', 'low', 'Almonds look excellent. Sizing is uniform. No signs of hull split yet. Minor mites on border rows near dirt road, but predatory beneficials are active.', '[{"pestName": "Pacific Spider Mite", "countPerLeaf": 1.2, "percentInfestation": 15}, {"pestName": "Predatory Thrips (beneficial)", "countPerLeaf": 0.8}]', 'Fruit Development', '{"type": "Point", "coordinates": [-119.715, 36.808]}', '[]'),
('sr2', 'f2', 'John Deere', '2026-06-09 09:15:00', 'medium', 'Some flagging observed on branches. Investigated and confirmed Peach Twig Borer larvae active in shoots. Suggest checking trap counts and considering a soft chemical treatment if count rises.', '[{"pestName": "Peach Twig Borer", "percentInfestation": 8}]', 'Fruit Development', '{"type": "Point", "coordinates": [-119.712, 36.798]}', '[]'),
('sr3', 'f4', 'Sara Agronomy', '2026-06-05 08:30:00', 'high', 'Severe Navel Orangeworm (NOW) infestation. Multiple egg masses found on old mummy nuts. Direct damage to fresh green hulls already visible on tree skirts. Heavy pressure. IMMEDIATE spray recommendation required.', '[{"pestName": "Navel Orangeworm", "countPerLeaf": 4.5, "percentInfestation": 35}]', 'Shell Hardening', '{"type": "Point", "coordinates": [-119.110, 35.415]}', '[]'),
('sr4', 'f7', 'Alex Crop', '2026-06-06 11:30:00', 'medium', 'Early Blight (Alternaria solani) lesioning spotted on lower canopy leaves. Spreading slightly due to recent heavy morning dews. Air flow is low. Will need alert on next irrigation cycle to not overwater.', '[{"pestName": "Early Blight", "percentInfestation": 12}]', 'Flowering & Fruit Set', '{"type": "Point", "coordinates": [-121.885, 38.705]}', '[]')
ON CONFLICT ("id") DO NOTHING;

-- Seed Soil Samples
INSERT INTO "soil_samples" ("id", "field_id", "sample_date", "lab_sample_number", "nitrogen_ppm", "phosphorus_ppm", "potassium_ppm", "organic_matter_pct", "ph", "status") VALUES
('ss1', 'f1', '2026-03-10', 'LAB-FRESNO-9912', 12, 28, 145, 1.8, 6.8, 'optimal'),
('ss2', 'f4', '2026-03-12', 'LAB-KERN-8823', 6, 18, 98, 1.1, 7.4, 'low')
ON CONFLICT ("id") DO NOTHING;

-- Seed Tissue Samples
INSERT INTO "tissue_samples" ("id", "field_id", "sample_date", "nitrogen_pct", "phosphorus_pct", "potassium_pct", "zinc_ppm", "status") VALUES
('ts1', 'f1', '2026-05-15', 2.3, 0.22, 1.45, 18, 'deficient'),
('ts2', 'f2', '2026-05-15', 2.1, 0.18, 1.22, 24, 'adequate')
ON CONFLICT ("id") DO NOTHING;

-- Seed Nitrogen Plans
INSERT INTO "nitrogen_plans" ("id", "field_id", "crop_year", "budgeted_n_lbs_per_acre", "applied_n_lbs_per_acre", "organic_n_lbs_per_acre", "irrigation_n_lbs_per_acre", "yield_goal_tons_per_acre", "credits_residual_n_lbs_per_acre") VALUES
('np1', 'f1', 2026, 200, 120, 20, 15, 1.2, 30),
('np2', 'f4', 2026, 150, 60, 0, 10, 1.5, 15)
ON CONFLICT ("id") DO NOTHING;
