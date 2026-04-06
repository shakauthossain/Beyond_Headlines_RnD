import { Router } from 'express';
import { articles } from '../data/mockData';
import { authenticate } from '../middleware/auth';
import { ok, notFound } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /analytics/overview:
 *   get:
 *     summary: Platform stats overview
 *     tags: [Analytics]
 */
router.get('/overview', authenticate, (req, res) => {
  return ok(res, {
    totalArticles: articles.length,
    publishedArticles: articles.filter(a => a.status === 'PUBLISHED').length,
    totalViews: 12450,
    averageReadTime: '4m 32s',
  });
});

/**
 * @swagger
 * /analytics/top-articles:
 *   get:
 *     summary: Top performing articles
 *     tags: [Analytics]
 */
router.get('/top-articles', authenticate, (req, res) => {
  return ok(res, articles.slice(0, 3).map(a => ({
    id: a.id,
    title: a.title,
    views: Math.floor(Math.random() * 5000),
    shares: Math.floor(Math.random() * 500),
  })));
});

/**
 * @swagger
 * /analytics/traffic:
 *   get:
 *     summary: Daily traffic data
 *     tags: [Analytics]
 */
router.get('/traffic', authenticate, (req, res) => {
  return ok(res, {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    values: [1200, 1500, 1100, 1800, 2200, 900, 800],
  });
});

/**
 * @swagger
 * /analytics/article/{slug}:
 *   get:
 *     summary: Per-article analytics
 *     tags: [Analytics]
 */
router.get('/article/:slug', authenticate, (req, res) => {
  const article = articles.find(a => a.slug === req.params.slug);
  if (!article) return notFound(res, 'Article not found');
  
  return ok(res, {
    views: 1200,
    averageTimeOnPage: '2m 15s',
    bounceRate: '45%',
  });
});

export default router;
