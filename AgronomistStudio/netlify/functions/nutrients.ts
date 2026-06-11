import type { Context, Config } from '@netlify/functions';
import { eq } from 'drizzle-orm';
import { db, schema } from './_shared/db';

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const path = url.pathname;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 1. GET /api/soil-samples
    if (path === '/api/soil-samples' && req.method === 'GET') {
      const fieldId = url.searchParams.get('fieldId');
      let samples;
      if (fieldId) {
        samples = await db.select().from(schema.soilSamples).where(eq(schema.soilSamples.fieldId, fieldId));
      } else {
        samples = await db.select().from(schema.soilSamples);
      }
      return new Response(JSON.stringify(samples), { status: 200, headers });
    }

    // 2. GET /api/tissue-samples
    if (path === '/api/tissue-samples' && req.method === 'GET') {
      const fieldId = url.searchParams.get('fieldId');
      let samples;
      if (fieldId) {
        samples = await db.select().from(schema.tissueSamples).where(eq(schema.tissueSamples.fieldId, fieldId));
      } else {
        samples = await db.select().from(schema.tissueSamples);
      }
      return new Response(JSON.stringify(samples), { status: 200, headers });
    }

    // 3. GET /api/nitrogen-plans
    if (path === '/api/nitrogen-plans' && req.method === 'GET') {
      const fieldId = url.searchParams.get('fieldId');
      let plans;
      if (fieldId) {
        plans = await db.select().from(schema.nitrogenPlans).where(eq(schema.nitrogenPlans.fieldId, fieldId));
      } else {
        plans = await db.select().from(schema.nitrogenPlans);
      }
      return new Response(JSON.stringify(plans), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  } catch (err: any) {
    console.error('Error in nutrients function:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers });
  }
};

export const config: Config = {
  path: ['/api/soil-samples', '/api/tissue-samples', '/api/nitrogen-plans'],
};
