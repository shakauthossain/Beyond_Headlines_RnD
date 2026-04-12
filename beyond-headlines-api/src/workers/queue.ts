import { Queue, Job } from 'bullmq';
import { redis } from '../redis/client';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

export const triggerScrapeJob = async (query?: string, category?: string): Promise<Job> => {
  const safeQuery = query ? query.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') : 'all';
  const job = await scrapeQueue.add(
    query ? `scrape-${safeQuery}` : 'scrape-all-sources',
    { query, category },
    {
      jobId: query ? `scrape-${safeQuery}-${Date.now()}` : `scrape-manual-${Date.now()}`,
    },
  );
  console.log(`[BullMQ] Scrape job triggered${query ? ` for: ${query}` : ''} [Category: ${category || 'General'}]`);
  return job;
};
