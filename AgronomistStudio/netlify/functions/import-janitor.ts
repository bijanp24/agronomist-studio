import type { Context, Config } from '@netlify/functions';
import { eq, and, lt, or } from 'drizzle-orm';
import { db, schema } from './_shared/db';

export default async (req: Request, context: Context) => {
  const startedAt = new Date();
  console.log(`Scheduled import-janitor started at: ${startedAt.toISOString()}`);

  try {
    // 30 minutes ago
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000);

    // Find stuck jobs
    const stuckJobs = await db.select()
      .from(schema.importJobs)
      .where(and(
        or(
          eq(schema.importJobs.status, 'processing'),
          eq(schema.importJobs.status, 'committing')
        ),
        lt(schema.importJobs.updatedAt, cutoffTime)
      ));

    let cleanedCount = 0;

    for (const job of stuckJobs) {
      // Mark as failed
      await db.update(schema.importJobs)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(schema.importJobs.id, job.id));

      // Insert error
      await db.insert(schema.importErrors).values({
        importId: job.id,
        row: 'system',
        field: 'janitor',
        message: 'Import job timed out or was abandoned during processing/committing.',
      });

      cleanedCount++;
    }

    const finishedAt = new Date();
    await db.insert(schema.jobRuns).values({
      jobName: 'import-janitor',
      startedAt,
      finishedAt,
      status: 'success',
      summary: {
        message: `Successfully cleaned up ${cleanedCount} stuck import jobs.`,
        jobs_cleaned: cleanedCount,
      },
    });

    console.log(`Scheduled import-janitor completed successfully at: ${finishedAt.toISOString()}`);
    return new Response('OK');
  } catch (err: any) {
    console.error('Error in import-janitor scheduled job:', err);
    try {
      await db.insert(schema.jobRuns).values({
        jobName: 'import-janitor',
        startedAt,
        finishedAt: new Date(),
        status: 'failed',
        error: err.message || 'Unknown error',
      });
    } catch (dbErr) {
      console.error('Failed to log failed job run to database:', dbErr);
    }
    return new Response('Error', { status: 500 });
  }
};

export const config: Config = {
  schedule: '@hourly',
};
