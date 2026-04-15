import { Router } from 'express';
import { extractSearchIntent } from '../services/ai.service';
import { enqueueIntentScrape, scrapeQueue, clusterQueue } from '../workers/queue';
import { db } from '../db/client';
import { redis } from '../redis/client';
import { ok, badRequest, serverError, notFound } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /search/intent:
 *   post:
 *     summary: Classify free-text query into strict scrape parameters
 *     tags: [Search]
 */
router.post('/intent', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return badRequest(res, 'Query string is required');
    }

    const intent = await extractSearchIntent(query);
    return ok(res, intent);
  } catch (err: any) {
    console.error(`[Search Route] /intent failed:`, err.message);
    return serverError(res, err);
  }
});

/**
 * @swagger
 * /search/run:
 *   post:
 *     summary: Enqueue intent-driven scrape job
 *     tags: [Search]
 */
  router.post('/run', async (req, res) => {
  try {
    const { query, category, region, timeframe, searchSlug, refinedQuery } = req.body;
    if (!query || !category || !region || !timeframe || !searchSlug || !refinedQuery) {
      return badRequest(res, 'All parameters (including searchSlug and refinedQuery) are required');
    }

    const result = await enqueueIntentScrape(query, { category, region, timeframe, searchSlug, refinedQuery });
    return ok(res, result);
  } catch (err: any) {
    console.error(`[Search Route] /run failed:`, err.message);
    return serverError(res, err);
  }
});

/**
 * @swagger
 * /search/status/{jobId}:
 *   get:
 *     summary: Get search job status and results
 *     tags: [Search]
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await scrapeQueue.getJob(jobId);

    if (!job) {
      return notFound(res, 'Job not found');
    }

    const scrapeState = await job.getState();
    
    // Check if scraping is done
    if (scrapeState !== 'completed') {
      return ok(res, { 
        status: 'scraping', 
        isFinished: false,
        message: 'Searching news sources...'
      });
    }

    // Checking if clustering is done (Clustering job starts after Scrape job)
    const clusterJobId = `cluster-${jobId}`;
    const clusterJob = await clusterQueue.getJob(clusterJobId);
    
    if (clusterJob) {
      const clusterState = await clusterJob.getState();
      if (clusterState !== 'completed') {
        return ok(res, { 
            status: 'clustering', 
            isFinished: false,
            message: 'Grouping narratives with AI...'
        });
      }
    }

    // Both are finished, retrieve filtered results from DB
    const { query, params } = job.data;
    const { category, timeframe } = params;

    const timeframeMap: Record<string, string> = {
      'last_24h': '24 hours',
      'last_week': '7 days',
      'last_month': '30 days',
      'any': '100 years'
    };
    const interval = timeframeMap[timeframe] || '7 days';

    const results = await db.$queryRawUnsafe(`
      SELECT id, source, headline, url, category, "scrapedAt" as "scrapedAt"
      FROM "ScrapedHeadline"
      WHERE
        "clusterId" IS NULL
        AND "category" IN ($2, 'General')
        AND "headline" ILIKE '%' || $1 || '%'
        AND "scrapedAt" > NOW() - INTERVAL '${interval}'
      ORDER BY "scrapedAt" DESC
      LIMIT 100
    `, query, category);

    return ok(res, { 
      status: 'completed', 
      isFinished: true, 
      results,
      meta: { query, category, timeframe }
    });

  } catch (err: any) {
    console.error(`[Search Route] /status failed:`, err.message);
    return serverError(res, err);
  }
});

export default router;
