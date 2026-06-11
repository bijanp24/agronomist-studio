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
    // 1. GET /api/scouting-reports
    if (path === '/api/scouting-reports' && req.method === 'GET') {
      const fieldId = url.searchParams.get('fieldId');
      let reports;
      if (fieldId) {
        reports = await db.select().from(schema.scoutingReports).where(eq(schema.scoutingReports.fieldId, fieldId));
      } else {
        reports = await db.select().from(schema.scoutingReports);
      }
      return new Response(JSON.stringify(reports), { status: 200, headers });
    }

    // 2. GET /api/scouting-reports/:id
    if (path.startsWith('/api/scouting-reports/') && req.method === 'GET') {
      const reportId = path.substring('/api/scouting-reports/'.length);
      const [report] = await db.select().from(schema.scoutingReports).where(eq(schema.scoutingReports.id, reportId)).limit(1);
      if (!report) {
        return new Response(JSON.stringify({ error: 'Scouting report not found' }), { status: 404, headers });
      }
      return new Response(JSON.stringify(report), { status: 200, headers });
    }

    // 3. POST /api/scouting-reports
    if (path === '/api/scouting-reports' && req.method === 'POST') {
      const body = await req.json();
      const reportId = `sr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const [newReport] = await db.insert(schema.scoutingReports).values({
        id: reportId,
        fieldId: body.fieldId,
        scouterName: body.scouterName,
        scoutedAt: new Date(),
        severity: body.severity,
        notes: body.notes,
        pestObservations: body.pestObservations || [],
        cropStage: body.cropStage,
        locationPin: body.locationPin || null,
        images: body.images || [],
      }).returning();

      // Update field's last scouted timestamp
      await db.update(schema.fields)
        .set({ lastScouted: new Date() })
        .where(eq(schema.fields.id, body.fieldId));

      return new Response(JSON.stringify(newReport), { status: 201, headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  } catch (err: any) {
    console.error('Error in scouting function:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers });
  }
};

export const config: Config = {
  path: ['/api/scouting-reports', '/api/scouting-reports/:id'],
};
