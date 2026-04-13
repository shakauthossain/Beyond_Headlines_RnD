import { Router } from 'express';
import { triggerScrapeJob } from '../workers/queue';
import { db } from '../db/client';
import { authenticate, requireAdmin, requireEditorOrAdmin } from '../middleware/auth';
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
  const job = await triggerScrapeJob(req.body?.query, req.body?.category || 'General');
  return ok(res, { jobId: job.id, message: 'Scrape job explicitly queued' });
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
  const lastHeadline = await db.scrapedHeadline.findFirst({
    orderBy: { scrapedAt: 'desc' }
  });
  
  if (!lastHeadline) {
    return ok(res, { lastRunDate: null, headlinesCount: 0 });
  }
  
  const count = await db.scrapedHeadline.count({
    where: { scrapedAt: { gte: new Date(lastHeadline.scrapedAt.getTime() - 1000 * 60 * 60) } }
  });
  
  return ok(res, { lastRunDate: lastHeadline.scrapedAt, headlinesCount: count });
});

/**
 * @swagger
 * /scrape/configs:
 *   get:
 *     summary: Get all scraper configurations
 *     tags: [Scrape]
 */
router.get('/configs', authenticate, async (req, res) => {
  const configs = await db.selectorConfig.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return ok(res, configs);
});

/**
 * @swagger
 * /scrape/configs:
 *   post:
 *     summary: Create a new scraper configuration
 *     tags: [Scrape]
 */
router.post('/configs', authenticate, requireEditorOrAdmin, async (req, res) => {
  const { sourceName, category, urlSlug, selector, isActive } = req.body;
  const config = await db.selectorConfig.create({
    data: { sourceName, category, urlSlug, selector, isActive: isActive ?? true }
  });
  return ok(res, config);
});

/**
 * @swagger
 * /scrape/configs/{id}:
 *   put:
 *     summary: Update a scraper configuration
 *     tags: [Scrape]
 */
router.put('/configs/:id', authenticate, requireEditorOrAdmin, async (req, res) => {
  try {
    const { sourceName, category, urlSlug, selector, isActive } = req.body;
    const config = await db.selectorConfig.update({
      where: { id: req.params.id },
      data: { sourceName, category, urlSlug, selector, isActive }
    });
    return ok(res, config);
  } catch (error: any) {
    console.error(`[ScraperConfig] Error updating config ${req.params.id}:`, error);
    throw error; // Let global error handler handle the response
  }
});

/**
 * @swagger
 * /scrape/configs/{id}:
 *   delete:
 *     summary: Delete a scraper configuration
 *     tags: [Scrape]
 */
router.delete('/configs/:id', authenticate, requireEditorOrAdmin, async (req, res) => {
  await db.selectorConfig.delete({
    where: { id: req.params.id }
  });
  return ok(res, { message: 'Configuration deleted' });
});

export default router;
