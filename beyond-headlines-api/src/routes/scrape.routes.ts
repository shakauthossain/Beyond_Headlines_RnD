import { Router } from 'express';
import { scrapedHeadlines } from '../data/mockData';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ok, notFound } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /scrape/trigger:
 *   post:
 *     summary: Manually queue a scrape job
 *     tags: [Scrape]
 */
router.post('/trigger', requireAdmin, (req, res) => {
  return ok(res, { jobId: 'job_' + Date.now(), status: 'QUEUED', message: 'Scrape job started' });
});

/**
 * @swagger
 * /scrape/status/{jobId}:
 *   get:
 *     summary: Scrape job status
 *     tags: [Scrape]
 */
router.get('/status/:jobId', authenticate, (req, res) => {
  return ok(res, { jobId: req.params.jobId, status: 'COMPLETED', progress: 100 });
});

/**
 * @swagger
 * /scrape/last-run:
 *   get:
 *     summary: Last scrape run summary
 *     tags: [Scrape]
 */
router.get('/last-run', authenticate, (req, res) => {
  return ok(res, {
    timestamp: new Date().toISOString(),
    headlinesScraped: 45,
    sourcesReached: 5,
    newClustersIdentified: 2,
  });
});

export default router;
