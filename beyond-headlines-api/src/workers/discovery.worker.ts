import { Worker, Queue, QueueEvents } from 'bullmq';
import { redis } from '../redis/client';
import { db } from '../db/client';
import { filterScrapedHeadlines, discoverStories } from '../services/ai.service';
import { triggerScrapeJob } from './queue';

const discoveryWorker = new Worker(
  'discovery',
  async (job) => {
    const {
      query,
      category = 'General',
      timeframe = 'past 48 hours',
      region = 'Bangladesh',
      searchSlug = '',
      refinedQuery = '',
    } = job.data;
    console.log(`[DiscoveryWorker] Starting hybrid discovery for query: "${query}" (Cat: ${category}, Time: ${timeframe}, Region: ${region})`);

    let queueEvents: QueueEvents | null = null;

    try {
      // 1. Mark status as STARTED in Redis
      await redis.set(`discovery:status:${job.id}`, 'STARTED', 'EX', 3600);

      // 2. Trigger targeted scrape for the actual query across all sources
      console.log(`[DiscoveryWorker] Triggering targeted scrape for query: "${query}" (Category: ${category})...`);
      // Pass the query and category to scraper so it performs search-based scraping
      // instead of generic front-page crawling
      const scrapeJob = await triggerScrapeJob(query, category, { searchSlug, refinedQuery, timeframe, region });
      
      queueEvents = new QueueEvents('scrape', { connection: redis });
      await scrapeJob.waitUntilFinished(queueEvents);
      console.log(`[DiscoveryWorker] Broad scrape completed.`);

      // 3. Fetch recent scraped headlines from across the DB (unclustered)
      // This ensures we are evaluating a wide net of recent local events perfectly.
      const rawHeadlines = await db.scrapedHeadline.findMany({
        where: { clusterId: null },
        orderBy: { scrapedAt: 'desc' },
        take: 200
      });

      // 4. Discover stories via Perplexity Sonar (Precision AI Fallback)
      console.log(`[DiscoveryWorker] Performing Precision Discovery via Perplexity for: "${query}"...`);
      const perplexityStories = await discoverStories(query, category, timeframe, region);
      
      // Merge local unclustered headlines with Perplexity stories
      const stories = [...perplexityStories, ...rawHeadlines.map(h => ({
        headline: h.headline,
        url: h.url,
        source: h.source,
        category: h.category
      }))];

      console.log(`[DiscoveryWorker] Combined ${perplexityStories.length} Perplexity stories with ${rawHeadlines.length} local headlines.`);

      // 5. Update the DB: UPSERT the relevant ones so their metadata is clean
      let count = 0;
      const targetIds: string[] = [];
      
      for (const s of stories) {
        try {
          const updated = await db.scrapedHeadline.upsert({
            where: { url: s.url },
            update: {
              headline: s.headline,
              category: category, // lock the category on the filtered results
              clusterId: null, // Allow clustering
            },
            create: {
              headline: s.headline,
              url:      s.url,
              source:   s.source,
              category: category,
            },
          });
          targetIds.push(updated.id);
          count++;
        } catch (dbErr: any) {
          console.error(`[DiscoveryWorker] Persist error for ${s.url}:`, dbErr.message);
        }
      }

      // 6. Update status to SCRAPING_DONE
      await redis.set(`discovery:status:${job.id}`, 'SCRAPING_DONE', 'EX', 3600);

      const clusterQueue = new Queue('cluster', { connection: redis });
      await clusterQueue.add('run-clustering', {
        originalJobId: job.id,
        category: category, 
        targetIds: targetIds,
        query,
        searchSlug,
        refinedQuery,
      }, {
        removeOnComplete: true,
        jobId: `cluster-${job.id}`,
      });

      console.log(`[DiscoveryWorker] Dispatched clustering for ${count} highly-relevant filtered headlines.`);
      if (queueEvents) await queueEvents.close();
      return { count };
    } catch (err: any) {
      console.error(`[DiscoveryWorker] Job failed:`, err.message);
      if (queueEvents) await queueEvents.close();
      throw err;
    }
  },
  { connection: redis, concurrency: 1 }
);

discoveryWorker.on('completed', (job) => console.log(`[DiscoveryWorker] Job ${job.id} done`));
discoveryWorker.on('failed', (job, err) => console.error(`[DiscoveryWorker] Job ${job?.id} failed:`, err.message));

console.log('[DiscoveryWorker] Listening for jobs on queue: discovery');
