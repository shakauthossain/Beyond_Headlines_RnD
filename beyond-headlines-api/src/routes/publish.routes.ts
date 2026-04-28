import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ok, notFound, prePublishError, forbidden } from '../utils/response';
import { PublishService } from '../services/publish.service';
import { db } from '../db/client';

const router = Router();

/**
 * @swagger
 * /publish/{articleId}:
 *   post:
 *     summary: Direct publish an article
 *     tags: [Publish — Step 7]
 */
router.post('/:articleId', authenticate, async (req, res) => {
  const article = await db.article.findUnique({ where: { id: req.params.articleId } });
  if (!article) return notFound(res, 'Article not found');

  const result = await PublishService.publish(req.params.articleId);

  const updated = await db.article.update({
    where: { id: req.params.articleId },
    data: { status: 'PUBLISHED', publishedAt: result.publishedAt },
  });

  return ok(res, updated);
});

/**
 * @swagger
 * /publish/{articleId}/submit-review:
 *   post:
 *     summary: Submit an article for review
 *     tags: [Publish — Step 7]
 */
router.post('/:articleId/submit-review', authenticate, async (req, res) => {
  const article = await db.article.findUnique({ where: { id: req.params.articleId } });
  if (!article) return notFound(res, 'Article not found');

  const updated = await db.article.update({ where: { id: req.params.articleId }, data: { status: 'PENDING_REVIEW' } });
  return ok(res, updated);
});

/**
 * @swagger
 * /publish/{articleId}/approve:
 *   post:
 *     summary: Admin approves and publishes article
 *     tags: [Publish — Step 7]
 */
router.post('/:articleId/approve', requireAdmin, async (req, res) => {
  const article = await db.article.findUnique({ where: { id: req.params.articleId } });
  if (!article) return notFound(res, 'Article not found');

  const result = await PublishService.publish(req.params.articleId);
  const updated = await db.article.update({
    where: { id: req.params.articleId },
    data: { status: 'PUBLISHED', publishedAt: result.publishedAt },
  });
  return ok(res, updated);
});

/**
 * @swagger
 * /publish/{articleId}/reject:
 *   post:
 *     summary: Reject an article back to draft
 *     tags: [Publish — Step 7]
 */
router.post('/:articleId/reject', requireAdmin, async (req, res) => {
  const article = await db.article.findUnique({ where: { id: req.params.articleId } });
  if (!article) return notFound(res, 'Article not found');

  const updated = await db.article.update({ where: { id: req.params.articleId }, data: { status: 'DRAFT' } });
  return ok(res, { ...updated, notes: req.body.notes });
});

/**
 * @swagger
 * /publish/queue:
 *   get:
 *     summary: Pending review queue
 *     tags: [Publish — Step 7]
 */
router.get('/queue', authenticate, async (req, res) => {
  const queue = await db.article.findMany({ where: { status: 'PENDING_REVIEW' }, orderBy: { updatedAt: 'desc' } });
  return ok(res, queue);
});

/**
 * @swagger
 * /publish/checklist/{articleId}:
 *   get:
 *     summary: Pre-publish checklist status
 *     tags: [Publish — Step 7]
 */
router.get('/checklist/:articleId', authenticate, async (req, res) => {
  const article = await db.article.findUnique({ where: { id: req.params.articleId } });
  if (!article) return notFound(res, 'Article not found');

  // Normalize fields expected by PublishService (convert `tags` -> `tagIds`)
  const normalized = { ...article, tagIds: (article as any).tags ?? [] } as any;
  const missing = PublishService.validateChecklist(normalized);

  if (missing.length > 0) return prePublishError(res, missing);
  return ok(res, { status: 'READY_TO_PUBLISH' });
});

export default router;
