import { Worker } from 'bullmq';
import { redis } from '../redis/client';
import { clusterQueue } from './queue';
import { scrapeAllSources, persistHeadlines } from '../services/scraper.service';

const scrapeWorker = new Worker(
  'scrape',
  async (job) => {
    console.log(`[ScrapeWorker] Starting job: ${job.name}`);

    // Step 1: Run Playwright/Cheerio scraper for all sources
    const headlines = await scrapeAllSources();
    
    // Step 2: Persist to PostgreSQL (upsert by URL)
    const count = await persistHeadlines(headlines);
    
    console.log(`[ScrapeWorker] Scraped and persisted ${count} headlines`);

    // Step 3: Dispatch clustering job to the next queue
    await clusterQueue.add('run-clustering', { headlineCount: count });

    return { headlineCount: count, completedAt: new Date().toISOString() };
  },
  { connection: redis, concurrency: 1 },
);

scrapeWorker.on('completed', (job) => console.log(`[ScrapeWorker] Job ${job.id} done`));
scrapeWorker.on('failed',    (job, err) => console.error(`[ScrapeWorker] Job ${job?.id} failed:`, err.message));

console.log('[ScrapeWorker] Listening for jobs on queue: scrape');
