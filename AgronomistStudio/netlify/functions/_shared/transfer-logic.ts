import {
  AreaValue,
  TransferField,
  GeoJsonGeometry,
  CropSeason,
  OperationType,
  FieldOperation,
  ColumnMapping,
  ValidationError,
  ParsedCsvRow,
} from 'shared';

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

export function normaliseOpType(raw: string): OperationType {
  const lower = raw.toLowerCase().trim();
  for (const [key, val] of Object.entries(KNOWN_OP_TYPES)) {
    if (lower.startsWith(key)) return val;
  }
  return 'other';
}

export function detectAreaUnit(raw: string): 'acre' | 'hectare' | null {
  return KNOWN_AREA_UNITS[raw.toLowerCase().trim()] ?? null;
}

export function convertArea(value: number, fromUnit: string, toUnit: 'acre' | 'hectare'): number {
  const from = KNOWN_AREA_UNITS[fromUnit.toLowerCase().trim()];
  if (!from) return value;
  if (from === toUnit) return value;
  return toUnit === 'hectare' ? value * ACRE_TO_HECTARE : value * HECTARE_TO_ACRE;
}

export function validateField(
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

export function validateOperation(
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

export function parseCsvText(csv: string): { headers: string[]; rows: ParsedCsvRow[] } {
  const lines = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]);
  const rows: ParsedCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: ParsedCsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function parseCsvLine(line: string): string[] {
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

const COLUMN_ALIASES: Record<string, string> = {
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

export function suggestColumnMappings(headers: string[]): ColumnMapping[] {
  return headers.map((h) => ({
    sourceColumn: h,
    canonicalField: COLUMN_ALIASES[h.toLowerCase().trim()] ?? h,
  }));
}
