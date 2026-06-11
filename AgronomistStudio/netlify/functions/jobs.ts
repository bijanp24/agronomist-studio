import type { Context, Config } from '@netlify/functions';
import { desc } from 'drizzle-orm';
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
    if (path === '/api/jobs/runs' && req.method === 'GET') {
      const runs = await db.select()
        .from(schema.jobRuns)
        .orderBy(desc(schema.jobRuns.startedAt))
        .limit(50);
      return new Response(JSON.stringify(runs), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
  } catch (err: any) {
    console.error('Error in jobs function:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), { status: 500, headers });
  }
};

export const config: Config = {
  path: '/api/jobs/runs',
};
