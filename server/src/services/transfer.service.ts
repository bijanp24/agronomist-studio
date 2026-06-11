import {
  Organization,
  Farm,
  AreaValue,
  TransferField,
  GeoJsonGeometry,
  CropSeason,
  TransferMeasurement,
  OperationType,
  FieldOperation,
  ColumnMapping,
  UnitConversion,
  ValidationError,
  ParsedCsvRow,
  GeoJsonFeatureCollection,
  ImportSession,
  Field,
  PlantingPlan,
  HarvestRecord,
  IrrigationEvent,
  ScoutingReport,
  SoilSample
} from 'shared';
import { dbStore } from './store.service';

const ACRE_TO_HECTARE = 0.404686;
const HECTARE_TO_ACRE = 2.47105;

const KNOWN_AREA_UNITS: Record<string, 'acre' | 'hectare'> = {
  acre: 'acre',
  acres: 'acre',
  ac: 'acre',
  hectare: 'hectare',
  hectares: 'hectare',
  ha: 'hectare',
};

const KNOWN_OP_TYPES: Record<string, OperationType> = {
  plant: 'planting',
  planting: 'planting',
  seeding: 'planting',
  harvest: 'harvest',
  harvesting: 'harvest',
  irrigat: 'irrigation',
  irrigation: 'irrigation',
  fertil: 'fertilizer',
  fertilizer: 'fertilizer',
  chemical: 'chemical',
  spray: 'chemical',
  till: 'tillage',
  tillage: 'tillage',
  scout: 'scouting',
  scouting: 'scouting',
  soil: 'soil_sample',
  'soil sample': 'soil_sample',
  soil_sample: 'soil_sample',
  recommendation: 'recommendation',
};

function normaliseOpType(raw: string): OperationType {
  const lower = raw.toLowerCase().trim();
  for (const [key, val] of Object.entries(KNOWN_OP_TYPES)) {
    if (lower.startsWith(key)) return val;
  }
  return 'other';
}

export class TransferService {
  private static instance: TransferService;
  private sessions = new Map<string, ImportSession>();

  private constructor() {}

  public static getInstance(): TransferService {
    if (!TransferService.instance) {
      TransferService.instance = new TransferService();
    }
    return TransferService.instance;
  }

  public getSession(importId: string): ImportSession | undefined {
    return this.sessions.get(importId);
  }

  public createSession(sourceSystem: string): ImportSession {
    const importId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const session: ImportSession = {
      importId,
      sourceSystem,
      status: 'pending',
      created: 0,
      updated: 0,
      skipped: 0,
      conflicted: 0,
      errors: [],
      organizations: [],
      farms: [],
      fields: [],
      cropSeasons: [],
      operations: [],
    };
    this.sessions.set(importId, session);
    return session;
  }

  public detectAreaUnit(raw: string): 'acre' | 'hectare' | null {
    return KNOWN_AREA_UNITS[raw.toLowerCase().trim()] ?? null;
  }

  public convertArea(value: number, fromUnit: string, toUnit: 'acre' | 'hectare'): number {
    const from = KNOWN_AREA_UNITS[fromUnit.toLowerCase().trim()];
    if (!from) return value;
    if (from === toUnit) return value;
    return toUnit === 'hectare' ? value * ACRE_TO_HECTARE : value * HECTARE_TO_ACRE;
  }

  public validateField(
    row: number | string,
    field: Partial<TransferField>,
    errors: ValidationError[],
  ): boolean {
    let valid = true;
    if (!field.name?.trim()) {
      errors.push({ row, field: 'name', message: 'Field name is required' });
      valid = false;
    }
    if (!field.farmId?.trim()) {
      errors.push({ row, field: 'farmId', message: 'Farm reference (farmId) is required' });
      valid = false;
    }
    if (field.area) {
      if (field.area.value <= 0) {
        errors.push({ row, field: 'area.value', message: `Area value must be positive (got ${field.area.value})` });
        valid = false;
      }
      if (field.area.value > 100_000) {
        errors.push({ row, field: 'area.value', message: `Area value ${field.area.value} is implausibly large` });
        valid = false;
      }
    }
    if (field.boundary) {
      const coords = (field.boundary as GeoJsonGeometry).coordinates;
      if (!coords) {
        errors.push({ row, field: 'boundary.coordinates', message: 'Boundary is missing coordinates' });
        valid = false;
      }
    }
    return valid;
  }

  public validateOperation(
    row: number | string,
    op: Partial<FieldOperation>,
    errors: ValidationError[],
  ): boolean {
    let valid = true;
    if (!op.fieldId?.trim()) {
      errors.push({ row, field: 'fieldId', message: 'fieldId is required' });
      valid = false;
    }
    if (!op.date?.trim()) {
      errors.push({ row, field: 'date', message: 'date is required' });
      valid = false;
    } else if (!/^\d{4}-\d{2}-\d{2}/.test(op.date)) {
      errors.push({ row, field: 'date', message: `date must start with ISO format YYYY-MM-DD (got "${op.date}")` });
      valid = false;
    } else {
      const d = new Date(op.date);
      if (isNaN(d.getTime())) {
        errors.push({ row, field: 'date', message: `date "${op.date}" is not a valid date` });
        valid = false;
      }
      if (d.getFullYear() < 1900 || d.getFullYear() > new Date().getFullYear() + 2) {
        errors.push({ row, field: 'date', message: `date "${op.date}" is outside plausible range` });
        valid = false;
      }
    }
    return valid;
  }

  public parseCsvText(csv: string): { headers: string[]; rows: ParsedCsvRow[] } {
    const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = this.parseCsvLine(lines[0]);
    const rows: ParsedCsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const row: ParsedCsvRow = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? '';
      });
      rows.push(row);
    }

    return { headers, rows };
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  private COLUMN_ALIASES: Record<string, string> = {
    field_name: 'name',
    fieldname: 'name',
    field: 'name',
    block: 'name',
    'field name': 'name',
    'block name': 'name',
    farm_name: 'farmName',
    farm: 'farmName',
    ranch: 'farmName',
    'farm name': 'farmName',
    operation: 'farmName',
    grower: 'growerName',
    grower_name: 'growerName',
    producer: 'growerName',
    customer: 'growerName',
    org: 'growerName',
    area: 'areaValue',
    acres: 'areaValue',
    hectares: 'areaValue',
    size: 'areaValue',
    field_size: 'areaValue',
    area_unit: 'areaUnit',
    unit: 'areaUnit',
    units: 'areaUnit',
    crop: 'cropName',
    crop_name: 'cropName',
    commodity: 'cropName',
    variety: 'variety',
    hybrid: 'variety',
    cultivar: 'variety',
    year: 'cropYear',
    crop_year: 'cropYear',
    season: 'cropYear',
    operation_type: 'operationType',
    op_type: 'operationType',
    activity: 'operationType',
    activity_type: 'operationType',
    date: 'date',
    op_date: 'date',
    activity_date: 'date',
    operation_date: 'date',
    applied_date: 'date',
    notes: 'notes',
    note: 'notes',
  };

  public suggestColumnMappings(headers: string[]): ColumnMapping[] {
    return headers.map((h) => ({
      sourceColumn: h,
      canonicalField: this.COLUMN_ALIASES[h.toLowerCase().trim()] ?? h,
    }));
  }

  public processCsvImport(
    importId: string,
    csvText: string,
    defaultFarmId: string,
    customMappings?: ColumnMapping[],
  ): ImportSession {
    const session = this.getSession(importId);
    if (!session) {
      throw new Error(`Import session ${importId} not found`);
    }

    const { headers, rows } = this.parseCsvText(csvText);
    const mappings = customMappings ?? this.suggestColumnMappings(headers);

    const fields: Partial<TransferField>[] = [];
    const cropSeasons: Partial<CropSeason>[] = [];
    const operations: Partial<FieldOperation>[] = [];
    const errors: ValidationError[] = [];

    rows.forEach((row, rowIndex) => {
      const mapped: Record<string, string> = {};
      mappings.forEach((m) => {
        mapped[m.canonicalField] = row[m.sourceColumn] ?? '';
      });

      // Parse area
      const areaRaw = parseFloat(mapped['areaValue'] ?? '');
      const areaUnitRaw = mapped['areaUnit'] ?? 'acre';
      const targetAreaUnit = this.detectAreaUnit(areaUnitRaw) ?? 'acre';
      const areaValue = isNaN(areaRaw) ? undefined : areaRaw;

      // Check if it looks like an operation row or field row or both.
      // If there's an operationType or date, we can generate an operation.
      const hasOp = mapped['operationType'] || mapped['date'];

      const fieldId = mapped['fieldId'] || `field-${rowIndex}-${Date.now()}`;
      const field: Partial<TransferField> = {
        id: fieldId,
        farmId: mapped['farmId'] || defaultFarmId,
        name: mapped['name'] || `Field ${rowIndex + 1}`,
        area: areaValue !== undefined ? { value: areaValue, unit: targetAreaUnit } : undefined,
        rawSourceId: String(rowIndex + 1),
        sourceSystem: session.sourceSystem,
      };

      this.validateField(rowIndex + 1, field, errors);
      fields.push(field);

      // Crop season
      const cropName = mapped['cropName'];
      if (cropName) {
        const cropYearRaw = parseInt(mapped['cropYear'] ?? '');
        const cropSeason: Partial<CropSeason> = {
          id: `season-${rowIndex}-${Date.now()}`,
          fieldId,
          cropYear: isNaN(cropYearRaw) ? new Date().getFullYear() : cropYearRaw,
          cropName,
          variety: mapped['variety'] || undefined,
        };
        cropSeasons.push(cropSeason);
      }

      // Operation
      if (hasOp) {
        const op: Partial<FieldOperation> = {
          id: `op-${rowIndex}-${Date.now()}`,
          fieldId,
          operationType: normaliseOpType(mapped['operationType'] ?? ''),
          date: mapped['date'] ?? new Date().toISOString().split('T')[0],
          sourceSystem: session.sourceSystem,
          rawSourceId: String(rowIndex + 1),
          measurements: [],
          notes: mapped['notes'] || undefined,
        };
        this.validateOperation(rowIndex + 1, op, errors);
        operations.push(op);
      }
    });

    session.fields = fields;
    session.cropSeasons = cropSeasons;
    session.operations = operations;
    session.errors = errors;
    session.status = errors.length > 0 ? 'failed' : 'validated';
    session.updated = Date.now();

    return session;
  }

  public processGeoJsonImport(
    importId: string,
    geojson: GeoJsonFeatureCollection,
    defaultFarmId: string,
  ): ImportSession {
    const session = this.getSession(importId);
    if (!session) {
      throw new Error(`Import session ${importId} not found`);
    }

    const fields: Partial<TransferField>[] = [];
    const errors: ValidationError[] = [];

    if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
      errors.push({ row: 'root', field: 'type', message: 'Expected a GeoJSON FeatureCollection' });
      session.errors = errors;
      session.status = 'failed';
      return session;
    }

    geojson.features.forEach((feature, i) => {
      const props = feature.properties ?? {};
      const name =
        (props['name'] as string) ??
        (props['field_name'] as string) ??
        (props['Name'] as string) ??
        (feature.id ? String(feature.id) : `Field ${i + 1}`);

      if (!feature.geometry?.type || !feature.geometry?.coordinates) {
        errors.push({ row: i + 1, field: 'geometry', message: `Feature ${i + 1} is missing a valid geometry` });
        return;
      }

      const areaVal = props['area'] || props['areaValue'] || props['acres'] || props['size'];
      let area: AreaValue | undefined = undefined;
      if (typeof areaVal === 'number' && areaVal > 0) {
        area = { value: areaVal, unit: 'acre' };
      }

      const field: Partial<TransferField> = {
        id: `field-geo-${i}-${Date.now()}`,
        farmId: defaultFarmId,
        name,
        boundary: feature.geometry,
        area,
        sourceSystem: session.sourceSystem,
        rawSourceId: feature.id ? String(feature.id) : String(i + 1),
      };

      this.validateField(i + 1, field, errors);
      fields.push(field);

      const crop = props['crop'] || props['cropName'] || props['commodity'];
      if (crop) {
        const year = props['year'] || props['cropYear'] || props['season'] || new Date().getFullYear();
        session.cropSeasons.push({
          id: `season-geo-${i}-${Date.now()}`,
          fieldId: field.id!,
          cropYear: typeof year === 'number' ? year : parseInt(String(year)) || new Date().getFullYear(),
          cropName: String(crop),
          variety: props['variety'] ? String(props['variety']) : undefined,
        });
      }
    });

    session.fields = fields;
    session.errors = errors;
    session.status = errors.length > 0 ? 'failed' : 'validated';
    session.updated = Date.now();

    return session;
  }

  public commitSession(
    importId: string,
    defaultRanchId: string,
  ): { success: boolean; created: number; updated: number; skipped: number; operationsAdded: number } {
    const session = this.getSession(importId);
    if (!session) {
      throw new Error(`Import session ${importId} not found`);
    }

    if (session.status === 'committed') {
      return {
        success: true,
        created: session.created,
        updated: session.updated,
        skipped: session.skipped,
        operationsAdded: session.operations.length,
      };
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let operationsAdded = 0;

    // Process fields
    session.fields.forEach((tf) => {
      const ranchId = tf.farmId || defaultRanchId;
      
      // Look for a crop season corresponding to this transfer field
      const matchingSeason = session.cropSeasons.find(cs => cs.fieldId === tf.id);
      const cropName = matchingSeason?.cropName || 'Almonds';
      const variety = matchingSeason?.variety || tf.sourceSystem || 'Imported';

      // Check if there is already a field with the exact same name in this ranch
      const existingField = dbStore.fields.find(
        (f) => f.ranchId === ranchId && f.name.toLowerCase().trim() === tf.name?.toLowerCase().trim()
      );

      if (existingField) {
        // Update existing field
        if (tf.area?.value) {
          existingField.areaAcres = this.convertArea(tf.area.value, tf.area.unit, 'acre');
        }
        if (tf.boundary) {
          existingField.boundaryJson = tf.boundary as any;
        }
        if (matchingSeason?.cropName) {
          existingField.crop = matchingSeason.cropName;
        }
        if (matchingSeason?.variety) {
          existingField.variety = matchingSeason.variety;
        }
        updatedCount++;
      } else {
        // Create new field
        const areaVal = tf.area?.value ? this.convertArea(tf.area.value, tf.area.unit, 'acre') : 40;
        const newField: Field = {
          id: tf.id || `field-imported-${Date.now()}-${Math.random()}`,
          ranchId,
          name: tf.name || `Field ${dbStore.fields.length + 1}`,
          crop: cropName,
          variety: variety,
          areaAcres: areaVal,
          county: dbStore.ranches.find(r => r.id === ranchId)?.county || 'Fresno',
          status: 'healthy',
          boundaryJson: tf.boundary as any,
          createdAt: new Date().toISOString(),
        };
        dbStore.fields.push(newField);
        createdCount++;
      }
    });

    // Process operations
    session.operations.forEach((op) => {
      // Find the field in our database that corresponds to this operation's fieldId
      // or search by matching the field name from the session's fields.
      let targetFieldId = op.fieldId;
      const sessionField = session.fields.find(f => f.id === op.fieldId);
      if (sessionField) {
        const matchingDbField = dbStore.fields.find(
          f => f.name.toLowerCase().trim() === sessionField.name?.toLowerCase().trim()
        );
        if (matchingDbField) {
          targetFieldId = matchingDbField.id;
        }
      }

      const matchingSeason = session.cropSeasons.find(cs => cs.fieldId === op.fieldId);
      const cropName = matchingSeason?.cropName || 'Almonds';
      const variety = matchingSeason?.variety || 'Imported';
      const cropYear = matchingSeason?.cropYear || new Date().getFullYear();

      if (op.operationType === 'planting') {
        const newPlan: PlantingPlan = {
          id: op.id || `plant-${Date.now()}-${Math.random()}`,
          fieldId: targetFieldId!,
          cropYear,
          crop: cropName,
          variety,
          targetPlantingDate: op.date || new Date().toISOString().split('T')[0],
          actualPlantingDate: op.date,
          targetHarvestDate: new Date(new Date(op.date || '').getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'planted',
        };
        dbStore.plantingPlans.push(newPlan);
        operationsAdded++;
      } else if (op.operationType === 'harvest') {
        const newHarvest: HarvestRecord = {
          id: op.id || `harvest-${Date.now()}-${Math.random()}`,
          fieldId: targetFieldId!,
          harvestDate: op.date || new Date().toISOString().split('T')[0],
          cropYear,
          crop: cropName,
          variety,
          totalYieldAmount: 4.2 * (dbStore.fields.find(f => f.id === targetFieldId)?.areaAcres || 40),
          yieldUnit: 'tons',
          operatorName: 'Data Hub Importer',
        };
        dbStore.harvestRecords.push(newHarvest);
        operationsAdded++;
      } else if (op.operationType === 'irrigation') {
        const newIrr: IrrigationEvent = {
          id: op.id || `irr-${Date.now()}-${Math.random()}`,
          fieldId: targetFieldId!,
          startedAt: `${op.date}T08:00:00Z`,
          endedAt: `${op.date}T16:00:00Z`,
          durationHours: 8,
          appliedInches: 0.5,
          gallonsApplied: 543000,
          status: 'completed',
        };
        dbStore.irrigationEvents.push(newIrr);
        operationsAdded++;
      } else if (op.operationType === 'scouting') {
        const newScout: ScoutingReport = {
          id: op.id || `scout-${Date.now()}-${Math.random()}`,
          fieldId: targetFieldId!,
          scoutName: 'Data Hub Importer',
          scoutedAt: `${op.date}T10:00:00Z`,
          pestPressure: 'low',
          diseasePressure: 'none',
          weedPressure: 'low',
          growthStage: 'V4',
          canopyCoverPct: 45,
          notes: op.notes || 'Imported via Data Transfer Hub',
        };
        dbStore.scoutingReports.push(newScout);
        operationsAdded++;
      } else if (op.operationType === 'soil_sample') {
        const newSoil: SoilSample = {
          id: op.id || `soil-${Date.now()}-${Math.random()}`,
          fieldId: targetFieldId!,
          sampleDate: op.date || new Date().toISOString().split('T')[0],
          depthInches: 12,
          organicMatterPct: 2.1,
          nitrogenPpm: 24,
          phosphorusPpm: 18,
          potassiumPpm: 145,
          ph: 6.8,
          ecDsM: 1.2,
          labName: 'AgLab Central',
          notes: 'Imported via Data Transfer Hub',
        };
        dbStore.soilSamples.push(newSoil);
        operationsAdded++;
      }
    });

    session.created = createdCount;
    session.updated = updatedCount;
    session.skipped = skippedCount;
    session.status = 'committed';

    return {
      success: true,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      operationsAdded,
    };
  }
}

export const transferService = TransferService.getInstance();
