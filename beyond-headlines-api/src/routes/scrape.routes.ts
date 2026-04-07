import { Router } from 'express';
import { ScraperService } from '../services/scraper.service';
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
router.post('/trigger', requireAdmin, async (req, res) => {
  const result = await ScraperService.triggerScrape();
  return ok(res, result);
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
router.get('/last-run', authenticate, async (req, res) => {
  const result = await ScraperService.getLastRun();
  return ok(res, result);
});

export default router;
