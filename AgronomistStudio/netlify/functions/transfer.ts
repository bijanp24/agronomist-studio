import type { Context, Config } from '@netlify/functions';
import { eq } from 'drizzle-orm';
import { db, schema } from './_shared/db';
import { suggestColumnMappings } from './_shared/transfer-logic';

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Enable CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 1. POST /api/transfer/session
    if (path === '/api/transfer/session' && req.method === 'POST') {
      const { sourceSystem } = await req.json();
      if (!sourceSystem) {
        return new Response(JSON.stringify({ error: 'sourceSystem is required' }), { status: 400, headers });
      }

      const importId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const [newJob] = await db.insert(schema.importJobs).values({
        id: importId,
        sourceSystem,
        status: 'pending',
      }).returning();

      const responseSession = {
        importId: newJob.id,
        sourceSystem: newJob.sourceSystem,
        status: newJob.status,
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

      return new Response(JSON.stringify(responseSession), { status: 201, headers });
    }

    // 2. POST /api/transfer/suggest-mappings
    if (path === '/api/transfer/suggest-mappings' && req.method === 'POST') {
      const { headers: csvHeaders } = await req.json();
      if (!Array.isArray(csvHeaders)) {
        return new Response(JSON.stringify({ error: 'headers array is required' }), { status: 400, headers });
      }
      const mappings = suggestColumnMappings(csvHeaders);
      return new Response(JSON.stringify(mappings), { status: 200, headers });
    }

    // 3. GET /api/transfer/preview/:importId
    if (path.startsWith('/api/transfer/preview/') && req.method === 'GET') {
      const importId = path.substring('/api/transfer/preview/'.length);
      if (!importId) {
        return new Response(JSON.stringify({ error: 'importId is required' }), { status: 400, headers });
      }

      const [job] = await db.select().from(schema.importJobs).where(eq(schema.importJobs.id, importId)).limit(1);
      if (!job) {
        return new Response(JSON.stringify({ error: `Import session ${importId} not found` }), { status: 404, headers });
      }

      // Fetch errors
      const errors = await db.select().from(schema.importErrors).where(eq(schema.importErrors.importId, importId));
      
      // Fetch staging fields
      const stagingFields = await db.select().from(schema.importStagingFields).where(eq(schema.importStagingFields.importId, importId));
      
      // Fetch staging seasons
      const stagingSeasons = await db.select().from(schema.importStagingSeasons).where(eq(schema.importStagingSeasons.importId, importId));
      
      // Fetch staging operations
      const stagingOperations = await db.select().from(schema.importStagingOperations).where(eq(schema.importStagingOperations.importId, importId));

      // Map back to ImportSession shape
      const session = {
        importId: job.id,
        sourceSystem: job.sourceSystem,
        status: job.status,
        created: job.createdCount,
        updated: job.updatedCount,
        skipped: job.skippedCount,
        conflicted: job.conflictedCount,
        errors: errors.map(e => ({
          row: isNaN(Number(e.row)) ? e.row : Number(e.row),
          field: e.field,
          message: e.message,
        })),
        organizations: [],
        farms: [],
        fields: stagingFields.map(f => ({
          id: f.id,
          farmId: f.farmId || undefined,
          name: f.name || undefined,
          boundary: f.boundary || undefined,
          area: (f.areaValue !== null && f.areaUnit) ? { value: f.areaValue, unit: f.areaUnit as 'acre' | 'hectare' } : undefined,
          rawSourceId: f.rawSourceId || undefined,
          sourceSystem: f.sourceSystem || undefined,
        })),
        cropSeasons: stagingSeasons.map(s => ({
          id: s.id,
          fieldId: s.fieldId || undefined,
          cropYear: s.cropYear || undefined,
          cropName: s.cropName || undefined,
          variety: s.variety || undefined,
        })),
        operations: stagingOperations.map(o => ({
          id: o.id,
          fieldId: o.fieldId || undefined,
          seasonId: o.seasonId || undefined,
          operationType: o.operationType || undefined,
          date: o.date || undefined,
          sourceSystem: o.sourceSystem || undefined,
          rawSourceId: o.rawSourceId || undefined,
          measurements: o.measurements || [],
          notes: o.notes || undefined,
        })),
      };

      return new Response(JSON.stringify(session), { status: 200, headers });
    }

    // 4. POST /api/transfer/commit
    if (path === '/api/transfer/commit' && req.method === 'POST') {
      const { importId, defaultRanchId } = await req.json();
      if (!importId) {
        return new Response(JSON.stringify({ error: 'importId is required' }), { status: 400, headers });
      }

      // Verify job exists
      const [job] = await db.select().from(schema.importJobs).where(eq(schema.importJobs.id, importId)).limit(1);
      if (!job) {
        return new Response(JSON.stringify({ error: `Import session ${importId} not found` }), { status: 404, headers });
      }

      // Update job status to committing
      await db.update(schema.importJobs)
        .set({
          status: 'committing',
          updatedAt: new Date(),
        })
        .where(eq(schema.importJobs.id, importId));

      // Trigger background commit function
      const origin = url.origin;
      const bgUrl = `${origin}/.netlify/functions/commit-import-background`;
      
      const triggerPromise = fetch(bgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importId,
          defaultRanchId,
        }),
      }).catch(err => {
        console.error('Failed to trigger background commit:', err);
      });

      context.waitUntil(triggerPromise);

      return new Response(JSON.stringify({ success: true, status: 'committing' }), { status: 202, headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  } catch (err: any) {
    console.error('Error in transfer function:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers });
  }
};

export const config: Config = {
  path: ['/api/transfer/session', '/api/transfer/suggest-mappings', '/api/transfer/preview/:importId', '/api/transfer/commit'],
};
