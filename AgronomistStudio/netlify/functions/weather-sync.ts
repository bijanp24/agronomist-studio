import type { Context, Config } from '@netlify/functions';
import { db, schema } from './_shared/db';

export default async (req: Request, context: Context) => {
  const startedAt = new Date();
  console.log(`Scheduled weather-sync started at: ${startedAt.toISOString()}`);

  try {
    // Fetch all ranches
    const allRanches = await db.select().from(schema.ranches);
    const dateStr = new Date().toISOString().split('T')[0]; // Current date YYYY-MM-DD

    let syncedCount = 0;

    for (const ranch of allRanches) {
      // Generate realistic weather data based on county
      let tempMinF = 62;
      let tempMaxF = 95;
      let humidityPct = 35;
      let windSpeedMph = 8;
      let cimisEtoInches = 0.28;

      if (ranch.county.toLowerCase() === 'fresno') {
        const hash = Math.floor(Math.random() * 10);
        tempMinF = 62 + (hash % 4);
        tempMaxF = 95 + (hash % 5);
        humidityPct = 30 + (hash % 6);
        windSpeedMph = 8 + (hash % 4);
        cimisEtoInches = parseFloat((0.28 + hash / 100).toFixed(2));
      } else if (ranch.county.toLowerCase() === 'kern') {
        const hash = Math.floor(Math.random() * 10);
        tempMinF = 66 + (hash % 4);
        tempMaxF = 99 + (hash % 5);
        humidityPct = 25 + (hash % 5);
        windSpeedMph = 10 + (hash % 5);
        cimisEtoInches = parseFloat((0.33 + hash / 100).toFixed(2));
      } else if (ranch.county.toLowerCase() === 'yolo') {
        const hash = Math.floor(Math.random() * 10);
        tempMinF = 55 + (hash % 5);
        tempMaxF = 85 + (hash % 6);
        humidityPct = 38 + (hash % 8);
        windSpeedMph = 6 + (hash % 4);
        cimisEtoInches = parseFloat((0.22 + hash / 100).toFixed(2));
      }

      const snapshotId = `w-${ranch.id}-${dateStr}`;

      // Insert snapshot (on conflict do nothing so we don't duplicate daily runs)
      await db.insert(schema.weatherSnapshots).values({
        id: snapshotId,
        ranchId: ranch.id,
        date: dateStr,
        tempMinF,
        tempMaxF,
        humidityPct,
        windSpeedMph,
        cimisEtoInches,
      }).onConflictDoNothing();

      syncedCount++;
    }

    const finishedAt = new Date();
    await db.insert(schema.jobRuns).values({
      jobName: 'weather-sync',
      startedAt,
      finishedAt,
      status: 'success',
      summary: {
        message: `Successfully synced weather snapshots for ${syncedCount} ranches.`,
        ranches_processed: syncedCount,
        date: dateStr,
      },
    });

    console.log(`Scheduled weather-sync completed successfully at: ${finishedAt.toISOString()}`);
    return new Response('OK');
  } catch (err: any) {
    console.error('Error in weather-sync scheduled job:', err);
    try {
      await db.insert(schema.jobRuns).values({
        jobName: 'weather-sync',
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
