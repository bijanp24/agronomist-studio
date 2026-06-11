import type { Context, Config } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import { eq } from 'drizzle-orm';
import { db, schema } from './_shared/db';

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const path = url.pathname;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const body = await req.json();
    const { importId, defaultFarmId } = body;

    if (!importId) {
      return new Response(JSON.stringify({ error: 'importId is required' }), { status: 400, headers });
    }

    // Verify job exists
    const [job] = await db.select().from(schema.importJobs).where(eq(schema.importJobs.id, importId)).limit(1);
    if (!job) {
      return new Response(JSON.stringify({ error: `Import session ${importId} not found` }), { status: 404, headers });
    }

    let format: 'csv' | 'geojson';
    let fileContent: string;
    let mappings: any = null;

    if (path === '/api/transfer/import/csv') {
      format = 'csv';
      const { csvText, mappings: customMappings } = body;
      if (!csvText) {
        return new Response(JSON.stringify({ error: 'csvText is required' }), { status: 400, headers });
      }
      fileContent = csvText;
      mappings = customMappings;
    } else if (path === '/api/transfer/import/geojson') {
      format = 'geojson';
      const { geojson } = body;
      if (!geojson) {
        return new Response(JSON.stringify({ error: 'geojson is required' }), { status: 400, headers });
      }
      fileContent = JSON.stringify(geojson);
    } else {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
    }

    // Write raw file to Netlify Blobs
    const store = getStore({ name: 'uploads', consistency: 'strong' });
    await store.set(importId, fileContent);

    // Update job status to processing
    await db.update(schema.importJobs)
      .set({
        status: 'processing',
        blobKey: importId,
        updatedAt: new Date(),
      })
      .where(eq(schema.importJobs.id, importId));

    // Trigger background processing function
    const origin = url.origin;
    const bgUrl = `${origin}/.netlify/functions/process-import-background`;
    
    const triggerPromise = fetch(bgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        importId,
        defaultFarmId,
        format,
        mappings,
      }),
    }).catch(err => {
      console.error('Failed to trigger background process:', err);
    });

    context.waitUntil(triggerPromise);

    // Return 202 Accepted with the updated job status
    const responseSession = {
      importId,
      sourceSystem: job.sourceSystem,
      status: 'processing',
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

    return new Response(JSON.stringify(responseSession), { status: 202, headers });
  } catch (err: any) {
    console.error('Error in transfer-upload function:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers });
  }
};

export const config: Config = {
  path: ['/api/transfer/import/csv', '/api/transfer/import/geojson'],
};
