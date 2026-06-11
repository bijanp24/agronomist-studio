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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 1. GET /api/ranches
    if (path === '/api/ranches' && req.method === 'GET') {
      const allRanches = await db.select().from(schema.ranches);
      return new Response(JSON.stringify(allRanches), { status: 200, headers });
    }

    // 2. GET /api/fields
    if (path === '/api/fields' && req.method === 'GET') {
      const ranchId = url.searchParams.get('ranchId');
      let allFields;
      if (ranchId) {
        allFields = await db.select().from(schema.fields).where(eq(schema.fields.ranchId, ranchId));
      } else {
        allFields = await db.select().from(schema.fields);
      }
      return new Response(JSON.stringify(allFields), { status: 200, headers });
    }

    // 3. GET /api/fields/:id
    if (path.startsWith('/api/fields/') && req.method === 'GET') {
      const fieldId = path.substring('/api/fields/'.length);
      const [field] = await db.select().from(schema.fields).where(eq(schema.fields.id, fieldId)).limit(1);
      if (!field) {
        return new Response(JSON.stringify({ error: 'Field not found' }), { status: 404, headers });
      }
      return new Response(JSON.stringify(field), { status: 200, headers });
    }

    // 4. POST /api/fields
    if (path === '/api/fields' && req.method === 'POST') {
      const body = await req.json();
      const fieldId = `field-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const [newField] = await db.insert(schema.fields).values({
        id: fieldId,
        ranchId: body.ranchId,
        name: body.name,
        crop: body.crop,
        variety: body.variety || null,
        areaAcres: body.areaAcres,
        county: body.county,
        status: body.status || 'healthy',
        boundaryJson: body.boundaryJson || null,
      }).returning();

      return new Response(JSON.stringify(newField), { status: 201, headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  } catch (err: any) {
    console.error('Error in ranches-fields function:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers });
  }
};

export const config: Config = {
  path: ['/api/ranches', '/api/fields', '/api/fields/:id'],
};
