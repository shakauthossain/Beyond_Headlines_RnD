import { Router } from 'express';
import { triggerDiscoveryJob } from '../workers/queue';
import { ok, badRequest } from '../utils/response';
import { db } from '../db/client';
import { redis } from '../redis/client';
import { categorizeQuery } from '../services/ai.service';

const router = Router();

/**
 * @swagger
 * /intelligence/scan:
 *   post:
 *     summary: Trigger an on-demand news intelligence scan
 *     tags: [Intelligence — Step 1]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Scan triggered with jobId
 *       400:
 *         description: Search query is required
 */
router.post('/scan', async (req, res) => {
  const { query, timeframe, region, forceCategory } = req.body;
  if (!query) return badRequest(res, 'Search query is required');

  // If the user forced a category, use it. Otherwise, let Claude auto-detect.
  let category = forceCategory && forceCategory !== 'Auto-detect' 
    ? forceCategory 
    : await categorizeQuery(query);
  
  // Trigger the new Perplexity Sonar discovery job, passing constraints down
  const job = await triggerDiscoveryJob(query, category, timeframe, region);
  
  // Initialize status in Redis
  await redis.set(`discovery:status:${job.id}`, 'STARTED', 'EX', 3600);
  
  return ok(res, { 
    message: `Intelligence discovery for ${category} triggered successfully`, 
    jobId:   job.id,
    query,
    category
  });
});

/**
 * @swagger
 * /intelligence/status/{id}:
 *   get:
 *     summary: Check the status of a discovery scan
 *     tags: [Intelligence — Step 1]
 *     parameters:
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
 *     tags: [Intelligence — Step 1]
 *     responses:
 *       200:
 *         description: List of trending clusters
 */
router.get('/trending', async (req, res) => {
  const { category } = req.query;
  
  const where: any = {};
  if (category) {
    where.category = category as string;
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
