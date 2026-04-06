import { Router } from 'express';
import { articles } from '../data/mockData';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ok, notFound, prePublishError, forbidden } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /publish/{articleId}:
 *   post:
 *     summary: Direct publish an article
 *     tags: [Publish — Step 7]
 */
router.post('/:articleId', authenticate, (req, res) => {
  const index = articles.findIndex(a => a.id === req.params.articleId);
  if (index === -1) return notFound(res, 'Article not found');
  
  articles[index].status = 'PUBLISHED';
  articles[index].publishedAt = new Date().toISOString();
  return ok(res, articles[index]);
});

/**
 * @swagger
 * /publish/{articleId}/submit-review:
 *   post:
 *     summary: Submit an article for review
 *     tags: [Publish — Step 7]
 */
router.post('/:articleId/submit-review', authenticate, (req, res) => {
  const index = articles.findIndex(a => a.id === req.params.articleId);
  if (index === -1) return notFound(res, 'Article not found');
  
  articles[index].status = 'PENDING_REVIEW';
  return ok(res, articles[index]);
});

/**
 * @swagger
 * /publish/{articleId}/approve:
 *   post:
 *     summary: Admin approves and publishes article
 *     tags: [Publish — Step 7]
 */
router.post('/:articleId/approve', requireAdmin, (req, res) => {
  const index = articles.findIndex(a => a.id === req.params.articleId);
  if (index === -1) return notFound(res, 'Article not found');
  
  articles[index].status = 'PUBLISHED';
  articles[index].publishedAt = new Date().toISOString();
  return ok(res, articles[index]);
});

/**
 * @swagger
 * /publish/{articleId}/reject:
 *   post:
 *     summary: Reject an article back to draft
 *     tags: [Publish — Step 7]
 */
router.post('/:articleId/reject', requireAdmin, (req, res) => {
  const index = articles.findIndex(a => a.id === req.params.articleId);
  if (index === -1) return notFound(res, 'Article not found');
  
  articles[index].status = 'DRAFT';
  return ok(res, { ...articles[index], notes: req.body.notes });
});

/**
 * @swagger
 * /publish/queue:
 *   get:
 *     summary: Pending review queue
 *     tags: [Publish — Step 7]
 */
router.get('/queue', authenticate, (req, res) => {
  const queue = articles.filter(a => a.status === 'PENDING_REVIEW');
  return ok(res, queue);
});

/**
 * @swagger
 * /publish/checklist/{articleId}:
 *   get:
 *     summary: Pre-publish checklist status
 *     tags: [Publish — Step 7]
 */
router.get('/checklist/:articleId', authenticate, (req, res) => {
  const article = articles.find(a => a.id === req.params.articleId);
  if (!article) return notFound(res, 'Article not found');

  const missing = [];
  if (!article.bannerImage) missing.push('Banner Image');
  if (article.tagIds.length === 0) missing.push('Tags');
  if (article.content.length < 100) missing.push('Minimum content length');

  if (missing.length > 0) return prePublishError(res, missing);
  return ok(res, { status: 'READY_TO_PUBLISH' });
});

export default router;
