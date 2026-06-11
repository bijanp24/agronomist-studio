import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { eq } from 'drizzle-orm';
import { db, schema } from './_shared/db';
import {
  parseCsvText,
  suggestColumnMappings,
  validateField,
  validateOperation,
  normaliseOpType,
  detectAreaUnit,
} from './_shared/transfer-logic';
import { ValidationError } from 'shared';

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let importId = '';
  try {
    const { importId: id, defaultFarmId, format, mappings: customMappings } = await req.json();
    importId = id;

    if (!importId) {
      return new Response('importId is required', { status: 400 });
    }

    console.log(`Background processing started for job: ${importId}`);

    // Fetch the raw file from Netlify Blobs
    const store = getStore({ name: 'uploads', consistency: 'strong' });
    const rawContent = await store.get(importId);

    if (!rawContent) {
      throw new Error(`Raw upload file not found in Blobs for job ${importId}`);
    }

    // Clear any existing staging data/errors for this job (in case of retry)
    await db.delete(schema.importErrors).where(eq(schema.importErrors.importId, importId));
    await db.delete(schema.importStagingFields).where(eq(schema.importStagingFields.importId, importId));
    await db.delete(schema.importStagingSeasons).where(eq(schema.importStagingSeasons.importId, importId));
    await db.delete(schema.importStagingOperations).where(eq(schema.importStagingOperations.importId, importId));

    const errors: ValidationError[] = [];

    if (format === 'csv') {
      const { headers, rows } = parseCsvText(rawContent);
      const mappings = customMappings ?? suggestColumnMappings(headers);

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndex = i + 1;

        const mapped: Record<string, string> = {};
        mappings.forEach((m: any) => {
          mapped[m.canonicalField] = row[m.sourceColumn] ?? '';
        });

        // Parse area
        const areaRaw = parseFloat(mapped['areaValue'] ?? '');
        const areaUnitRaw = mapped['areaUnit'] ?? 'acre';
        const targetAreaUnit = detectAreaUnit(areaUnitRaw) ?? 'acre';
        const areaValue = isNaN(areaRaw) ? null : areaRaw;

        // Check if it looks like an operation row or field row or both.
        const hasOp = mapped['operationType'] || mapped['date'];

        const fieldId = mapped['fieldId'] || `field-${i}-${Date.now()}`;
        const stagingField = {
          id: fieldId,
          importId,
          farmId: mapped['farmId'] || defaultFarmId,
          name: mapped['name'] || `Field ${rowIndex}`,
          boundary: null,
          areaValue,
          areaUnit: targetAreaUnit,
          rawSourceId: String(rowIndex),
          sourceSystem: 'CSV Import',
        };

        validateField(rowIndex, {
          id: stagingField.id,
          farmId: stagingField.farmId,
          name: stagingField.name,
          area: areaValue !== null ? { value: areaValue, unit: targetAreaUnit } : undefined,
        }, errors);

        await db.insert(schema.importStagingFields).values(stagingField);

        // Crop season
        const cropName = mapped['cropName'];
        if (cropName) {
          const cropYearRaw = parseInt(mapped['cropYear'] ?? '');
          const stagingSeason = {
            id: `season-${i}-${Date.now()}`,
            importId,
            fieldId,
            cropYear: isNaN(cropYearRaw) ? new Date().getFullYear() : cropYearRaw,
            cropName,
            variety: mapped['variety'] || null,
          };
          await db.insert(schema.importStagingSeasons).values(stagingSeason);
        }

        // Operation
        if (hasOp) {
          const opType = normaliseOpType(mapped['operationType'] ?? '');
          const opDate = mapped['date'] ?? new Date().toISOString().split('T')[0];
          const stagingOp = {
            id: `op-${i}-${Date.now()}`,
            importId,
            fieldId,
            seasonId: null,
            operationType: opType,
            date: opDate,
            sourceSystem: 'CSV Import',
            rawSourceId: String(rowIndex),
            measurements: [],
            notes: mapped['notes'] || null,
          };

          validateOperation(rowIndex, {
            fieldId: stagingOp.fieldId,
            date: stagingOp.date,
          }, errors);

          await db.insert(schema.importStagingOperations).values(stagingOp);
        }
      }
    } else if (format === 'geojson') {
      const geojson = JSON.parse(rawContent);

      if (geojson.type !== 'FeatureCollection' || !Array.isArray(geojson.features)) {
        errors.push({ row: 'root', field: 'type', message: 'Expected a GeoJSON FeatureCollection' });
      } else {
        for (let i = 0; i < geojson.features.length; i++) {
          const feature = geojson.features[i];
          const rowIndex = i + 1;
          const props = feature.properties ?? {};
          const name =
            (props['name'] as string) ??
            (props['field_name'] as string) ??
            (props['Name'] as string) ??
            (feature.id ? String(feature.id) : `Field ${rowIndex}`);

          if (!feature.geometry?.type || !feature.geometry?.coordinates) {
            errors.push({ row: rowIndex, field: 'geometry', message: `Feature ${rowIndex} is missing a valid geometry` });
            continue;
          }

          const areaVal = props['area'] || props['areaValue'] || props['acres'] || props['size'];
          let areaValue: number | null = null;
          if (typeof areaVal === 'number' && areaVal > 0) {
            areaValue = areaVal;
          }

          const fieldId = `field-geo-${i}-${Date.now()}`;
          const stagingField = {
            id: fieldId,
            importId,
            farmId: defaultFarmId,
            name,
            boundary: feature.geometry,
            areaValue,
            areaUnit: 'acre',
            rawSourceId: feature.id ? String(feature.id) : String(rowIndex),
            sourceSystem: 'GeoJSON Import',
          };

          validateField(rowIndex, {
            id: stagingField.id,
            farmId: stagingField.farmId,
            name: stagingField.name,
            boundary: stagingField.boundary as any,
            area: areaValue !== null ? { value: areaValue, unit: 'acre' } : undefined,
          }, errors);

          await db.insert(schema.importStagingFields).values(stagingField);

          const crop = props['crop'] || props['cropName'] || props['commodity'];
          if (crop) {
            const year = props['year'] || props['cropYear'] || props['season'] || new Date().getFullYear();
            const stagingSeason = {
              id: `season-geo-${i}-${Date.now()}`,
              importId,
              fieldId,
              cropYear: typeof year === 'number' ? year : parseInt(String(year)) || new Date().getFullYear(),
              cropName: String(crop),
              variety: props['variety'] ? String(props['variety']) : null,
            };
            await db.insert(schema.importStagingSeasons).values(stagingSeason);
          }
        }
      }
    }

    // Write errors to database
    if (errors.length > 0) {
      for (const err of errors) {
        await db.insert(schema.importErrors).values({
          importId,
          row: String(err.row),
          field: err.field,
          message: err.message,
        });
      }
    }

    // Update job status
    const finalStatus = errors.length > 0 ? 'failed' : 'validated';
    await db.update(schema.importJobs)
      .set({
        status: finalStatus,
        updatedAt: new Date(),
      })
      .where(eq(schema.importJobs.id, importId));

    console.log(`Background processing completed for job: ${importId}. Status: ${finalStatus}`);
    return new Response('OK');
  } catch (err: any) {
    console.error('Error in background processing:', err);
    if (importId) {
      await db.insert(schema.importErrors).values({
        importId,
        row: 'system',
        field: 'process',
        message: err.message || 'Unknown processing error',
      });
      await db.update(schema.importJobs)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(schema.importJobs.id, importId));
    }
    return new Response('Error', { status: 500 });
  }
};
