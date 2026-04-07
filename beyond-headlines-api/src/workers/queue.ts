import { Queue } from 'bullmq';
import { redis } from '../redis/client';
import { config } from '../config';

const connection = redis;

// ── Queue definitions ─────────────────────────────────────────────────────────

export const scrapeQueue = new Queue('scrape', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
  },
});

export const clusterQueue = new Queue('cluster', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
  },
});

export const researchQueue = new Queue('research', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
  },
});

// ── Scheduler: register the repeating scrape job ──────────────────────────────
// Call this once on app startup. BullMQ persists the repeatable job in Redis,
// so duplicate registrations are safely deduplicated.

export const scheduleScrapeJob = async (): Promise<void> => {
  await scrapeQueue.add(
    'scrape-all-sources',
    {},
    {
      repeat: { every: config.scrapeIntervalMs },
      jobId: 'scrape-repeatable', // stable ID — prevents duplicates
    },
  );
  console.log(`[BullMQ] Scrape job scheduled every ${config.scrapeIntervalMs / 60000} minutes`);
};
