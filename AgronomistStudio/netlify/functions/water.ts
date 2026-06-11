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
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 1. GET /api/weather
    if (path === '/api/weather' && req.method === 'GET') {
      const ranchId = url.searchParams.get('ranchId');
      let weather;
      if (ranchId) {
        weather = await db.select().from(schema.weatherSnapshots).where(eq(schema.weatherSnapshots.ranchId, ranchId));
      } else {
        weather = await db.select().from(schema.weatherSnapshots);
      }
      return new Response(JSON.stringify(weather), { status: 200, headers });
    }

    // 2. GET /api/irrigation-events
    if (path === '/api/irrigation-events' && req.method === 'GET') {
      const fieldId = url.searchParams.get('fieldId');
      let events;
      if (fieldId) {
        events = await db.select().from(schema.irrigationEvents).where(eq(schema.irrigationEvents.fieldId, fieldId));
      } else {
        events = await db.select().from(schema.irrigationEvents);
      }
      return new Response(JSON.stringify(events), { status: 200, headers });
    }

    // 3. POST /api/irrigation-events
    if (path === '/api/irrigation-events' && req.method === 'POST') {
      const body = await req.json();
      const eventId = `ie-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const [newEvent] = await db.insert(schema.irrigationEvents).values({
        id: eventId,
        fieldId: body.fieldId,
        startedAt: new Date(body.startedAt),
        endedAt: new Date(body.endedAt),
        durationHours: body.durationHours,
        appliedInches: body.appliedInches,
        gallonsApplied: body.gallonsApplied,
        status: body.status || 'completed',
      }).returning();

      return new Response(JSON.stringify(newEvent), { status: 201, headers });
    }

    // 4. PATCH /api/irrigation-events/:id
    if (path.startsWith('/api/irrigation-events/') && req.method === 'PATCH') {
      const eventId = path.substring('/api/irrigation-events/'.length);
      const body = await req.json();

      const updateData: any = {};
      if (body.startedAt) updateData.startedAt = new Date(body.startedAt);
      if (body.endedAt) updateData.endedAt = new Date(body.endedAt);
      if (body.durationHours !== undefined) updateData.durationHours = body.durationHours;
      if (body.appliedInches !== undefined) updateData.appliedInches = body.appliedInches;
      if (body.gallonsApplied !== undefined) updateData.gallonsApplied = body.gallonsApplied;
      if (body.status) updateData.status = body.status;

      const [updatedEvent] = await db.update(schema.irrigationEvents)
        .set(updateData)
        .where(eq(schema.irrigationEvents.id, eventId))
        .returning();

      if (!updatedEvent) {
        return new Response(JSON.stringify({ error: 'Irrigation event not found' }), { status: 404, headers });
      }

      return new Response(JSON.stringify(updatedEvent), { status: 200, headers });
    }

    // 5. GET /api/soil-moisture
    if (path === '/api/soil-moisture' && req.method === 'GET') {
      const fieldId = url.searchParams.get('fieldId');
      let readings;
      if (fieldId) {
        readings = await db.select().from(schema.soilMoistureReadings).where(eq(schema.soilMoistureReadings.fieldId, fieldId));
      } else {
        readings = await db.select().from(schema.soilMoistureReadings);
      }
      return new Response(JSON.stringify(readings), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  } catch (err: any) {
    console.error('Error in water function:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers });
  }
};

export const config: Config = {
  path: ['/api/weather', '/api/irrigation-events', '/api/irrigation-events/:id', '/api/soil-moisture'],
};
