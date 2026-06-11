import type { Context, Config } from '@netlify/functions';
import { eq, desc } from 'drizzle-orm';
import { db, schema } from './_shared/db';

export default async (req: Request, context: Context) => {
  const startedAt = new Date();
  console.log(`Scheduled field-health-monitor started at: ${startedAt.toISOString()}`);

  try {
    const allFields = await db.select().from(schema.fields);
    
    let healthyCount = 0;
    let needsAttentionCount = 0;
    let criticalCount = 0;

    for (const field of allFields) {
      // Fetch latest soil moisture reading
      const [latestMoisture] = await db.select()
        .from(schema.soilMoistureReadings)
        .where(eq(schema.soilMoistureReadings.fieldId, field.id))
        .orderBy(desc(schema.soilMoistureReadings.timestamp))
        .limit(1);

      // Fetch latest scouting report
      const [latestScouting] = await db.select()
        .from(schema.scoutingReports)
        .where(eq(schema.scoutingReports.fieldId, field.id))
        .orderBy(desc(schema.scoutingReports.scoutedAt))
        .limit(1);

      let newStatus: 'healthy' | 'needs-attention' | 'critical' = 'healthy';

      // Evaluation rules
      if (latestMoisture && latestMoisture.averagePct < 20) {
        newStatus = 'critical';
      } else if (latestScouting && latestScouting.severity === 'high') {
        newStatus = 'critical';
      } else if (latestMoisture && latestMoisture.averagePct >= 20 && latestMoisture.averagePct <= 25) {
        newStatus = 'needs-attention';
      } else if (latestScouting && latestScouting.severity === 'medium') {
        newStatus = 'needs-attention';
      }

      // Update field status
      await db.update(schema.fields)
        .set({ status: newStatus })
        .where(eq(schema.fields.id, field.id));

      if (newStatus === 'healthy') healthyCount++;
      else if (newStatus === 'needs-attention') needsAttentionCount++;
      else if (newStatus === 'critical') criticalCount++;
    }

    const finishedAt = new Date();
    await db.insert(schema.jobRuns).values({
      jobName: 'field-health-monitor',
      startedAt,
      finishedAt,
      status: 'success',
      summary: {
        message: `Successfully evaluated health status for ${allFields.length} fields.`,
        fields_processed: allFields.length,
        status_counts: {
          healthy: healthyCount,
          needs_attention: needsAttentionCount,
          critical: criticalCount,
        },
      },
    });

    console.log(`Scheduled field-health-monitor completed successfully at: ${finishedAt.toISOString()}`);
    return new Response('OK');
  } catch (err: any) {
    console.error('Error in field-health-monitor scheduled job:', err);
    try {
      await db.insert(schema.jobRuns).values({
        jobName: 'field-health-monitor',
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
  schedule: '@daily',
};
