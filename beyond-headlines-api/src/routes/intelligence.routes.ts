import { Router } from 'express';
import { triggerDiscoveryJob } from '../workers/queue';
import { ok, badRequest } from '../utils/response';
import { db } from '../db/client';
import { redis } from '../redis/client';
import { extractSearchIntent } from '../services/ai.service';

const router = Router();

/**
 * @swagger
 * /intelligence/scan:
 *   post:
 *     summary: Trigger an on-demand news intelligence scan
 *     tags: [Step 01 - Intelligence]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               query: { type: string }
 *               timeframe: { type: string }
 *               region: { type: string }
 *               forceCategory: { type: string }
 *             required: [email, query]
 *     responses:
 *       200:
 *         description: Scan triggered with jobId
 *       400:
 *         description: Search query is required
 */
router.post('/scan', async (req, res) => {
  const { query, timeframe, region, forceCategory } = req.body;
  if (!query) return badRequest(res, 'Search query is required');

  const intent = await extractSearchIntent(query);
  const category = forceCategory && forceCategory !== 'Auto-detect'
    ? forceCategory
    : intent.category;

  const scanParams = {
    category,
    region: region || intent.region,
    timeframe: timeframe || intent.timeframe,
    searchSlug: intent.searchSlug,
    refinedQuery: intent.refinedQuery,
  };
  
  // Trigger the new Perplexity Sonar discovery job, passing constraints down
  const job = await triggerDiscoveryJob(query, scanParams);
  
  // Initialize status in Redis
  await redis.set(`discovery:status:${job.id}`, 'STARTED', 'EX', 3600);
  
  return ok(res, { 
    message: `Intelligence discovery for ${category} triggered successfully`, 
    jobId:   job.id,
    query,
    category,
    searchSlug: intent.searchSlug,
    refinedQuery: intent.refinedQuery,
  });
});

/**
 * @swagger
 * /intelligence/status/{id}:
 *   get:
 *     summary: Check the status of a discovery scan
 *     tags: [Step 01 - Intelligence]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - $ref: '#/components/parameters/emailParam'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current status of the scan
 */
router.get('/status/:id', async (req, res) => {
  const { id } = req.params;
  const status = await redis.get(`discovery:status:${id}`);
  
  if (!status) {
    return badRequest(res, 'Invalid or expired Job ID');
  }
  
  return ok(res, { jobId: id, status });
});

/**
 * @swagger
 * /intelligence/trending:
 *   get:
 *     summary: Get top trending clusters
 *     tags: [Step 01 - Intelligence]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - $ref: '#/components/parameters/emailParam'
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of trending clusters
 */
router.get('/trending', async (req, res) => {
  const { category, query } = req.query;
  
  const where: any = {};
  if (category) {
    where.category = category as string;
  }

  if (query && typeof query === 'string' && query.trim().length > 0) {
    const tokens = query
      .toLowerCase()
      .split(/\W+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 4)
      .slice(0, 8);

    if (tokens.length > 0) {
      where.OR = [
        { topic: { contains: query as string, mode: 'insensitive' } },
        { summary: { contains: query as string, mode: 'insensitive' } },
        ...tokens.map((token) => ({ topic: { contains: token, mode: 'insensitive' as const } })),
        ...tokens.map((token) => ({ summary: { contains: token, mode: 'insensitive' as const } })),
      ];
    }
  }

  const clusters = await db.cluster.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: {
      headlines: true
    }
  });
  
  return ok(res, clusters);
});

export default router;
