import { Queue, Job } from 'bullmq';
import { redis } from '../redis/client';
import crypto from 'crypto';

const connection = redis;

// ── Queue definitions ─────────────────────────────────────────────────────────

export const scrapeQueue = new Queue('scrape', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: false, // Keep failed jobs for DLQ inspection
    attempts: 3,         // 3 attempts
    backoff: {
      type: 'exponential',
      delay: 2000,       // starting at 2 seconds
    },
    priority: 5,         // default background priority
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

export const discoveryQueue = new Queue('discovery', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

export const triggerDiscoveryJob = async (
  query: string, 
  category: string = 'General',
  timeframe: string = 'past 48 hours',
  region: string = 'Bangladesh'
): Promise<Job> => {
  const safeQuery = query.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  const job = await discoveryQueue.add(
    `discovery-${safeQuery}`,
    { query, category, timeframe, region },
    {
      jobId: `discovery-${safeQuery}-${Date.now()}`,
    },
  );
  console.log(`[BullMQ] Discovery job triggered: ${query} (Cat: ${category}, Time: ${timeframe}, Region: ${region})`);
  return job;
};

export const triggerScrapeJob = async (query?: string, category: string = 'General'): Promise<Job> => {
  const safeQuery = query ? query.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '') : 'all';
  const job = await scrapeQueue.add(
    query ? `scrape-${safeQuery}` : 'scrape-all-sources',
    { query, category },
    {
      jobId: query ? `scrape-${safeQuery}-${Date.now()}` : 'scrape-manual',
      priority: 5, // Legacy manual UI syncs run at standard priority
    },
  );
  console.log(`[BullMQ] Scrape job triggered${query ? ` for: ${query}` : ''} (Category: ${category})`);
  return job;
};

// ── STEP 3: Intent-Driven Caching & Job ───────────────────────────────────────

export const enqueueIntentScrape = async (
  query: string,
  params: { category: string; region: string; timeframe: string; searchSlug: string; refinedQuery: string }
): Promise<{ jobId: string, cached: boolean }> => {
  const safeQuery = query.toLowerCase().trim();
  
  // SHA-256 Cache Check
  const hash = crypto.createHash('sha256');
  hash.update(params.category + params.region + params.timeframe + safeQuery);
  const cacheKey = `search:cache:${hash.digest('hex')}`;
  
  const existingJobId = await redis.get(cacheKey);
  if (existingJobId) {
    console.log(`[Redis] Cache HIT for Intent hash: ${cacheKey}`);
    return { jobId: existingJobId, cached: true };
  }

  // Cache MISS -> Generate Job with Priority 1
  const job = await scrapeQueue.add(
    `intent-scrape-${safeQuery.replace(/\s+/g, '-')}`,
    { query, params, cacheKey },
    {
      jobId: `intent-${Date.now()}`, // Unique ID
      priority: 1, // User-triggered jobs must run immediately ahead of background jobs
    }
  );

  // Set 2 hour TTL cache pointing to this jobId
  await redis.set(cacheKey, job.id!, 'EX', 7200);
  
  console.log(`[BullMQ] Intent job ${job.id} queued. Cache locked for 2 hours.`);
  return { jobId: job.id!, cached: false };
};
