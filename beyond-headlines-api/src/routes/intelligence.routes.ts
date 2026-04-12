import { Router } from 'express';
import { triggerScrapeJob } from '../workers/queue';
import { ok, badRequest } from '../utils/response';
import { db } from '../db/client';
import { redis } from '../redis/client';
import { classifyQuery } from '../services/ai.service';

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
 */
router.post('/scan', async (req, res) => {
  const { query } = req.body;
  
  // 1. Classify the query to understand its topic (e.g. Sports, Business)
  const category = await classifyQuery(query);
  console.log(`[Intelligence] Query "${query}" classified as: ${category}`);

  // 2. Trigger the background job with the identified category
  const job = await triggerScrapeJob(query, category);
  
  // Initialize status in Redis
  await redis.set(`discovery:status:${job.id}`, 'STARTED', 'EX', 3600);
  
  return ok(res, { 
    message: 'Intelligence scan triggered successfully', 
    jobId:   job.id,
    query 
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
  const clusters = await db.cluster.findMany({
    orderBy: { createdAt: 'desc' },
    take: 12, // Show more recent clusters to avoid missing new discoveries
    include: {
      headlines: true
    }
  });
  
  return ok(res, clusters);
});

export default router;
