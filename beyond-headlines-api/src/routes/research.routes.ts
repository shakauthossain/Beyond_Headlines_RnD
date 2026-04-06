import { Router } from 'express';
import { researchSessions, clusters, articles } from '../data/mockData';
import { topicBriefSchema, researchGenerateSchema } from '../types/ai.types';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';
import { LATENCY } from '../utils/delay';

const router = Router();

/**
 * @swagger
 * /research/topic-brief:
 *   post:
 *     summary: Generate an AI topic brief
 *     tags: [Research — Steps 2 & 3]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clusterId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Topic brief generated
 */
router.post('/topic-brief', authenticate, validate(topicBriefSchema), async (req, res) => {
  await LATENCY.sonnet();
  const cluster = clusters.find(c => c.id === req.body.clusterId);
  if (!cluster) return notFound(res, 'Cluster not found');

  const brief = {
    clusterId: cluster.id,
    title: `Brief: ${cluster.name}`,
    framing: `This topic explores the intersection of ${cluster.description}.`,
    keyAngles: ['Economic impact', 'Public sentiment', 'Policy shifts'],
    generatedAt: new Date().toISOString(),
  };
  return created(res, brief);
});

/**
 * @swagger
 * /research/generate:
 *   post:
 *     summary: Generate a full research session
 *     tags: [Research — Steps 2 & 3]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Research session generated
 */
router.post('/generate', authenticate, validate(researchGenerateSchema), async (req, res) => {
  await LATENCY.research();
  const article = articles.find(a => a.id === req.body.articleId);
  
  const newSession = {
    id: `rs${researchSessions.length + 1}`,
    articleId: req.body.articleId,
    topic: article ? article.title : 'Deep Research Session',
    sources: [
      { title: 'Official Gazetted Policy', url: 'https://gov.bd/policy', credibility: 0.98 },
      { title: 'Independent Economic Audit', url: 'https://audit.org/report', credibility: 0.92 }
    ],
    timeline: [
      { event: 'Policy draft introduced', date: '2024-01-10' },
      { event: 'Public consultation phase', date: '2024-02-15' }
    ],
    dataPoints: [
      { label: 'Projected Budget Impact', value: '2.5 Billion BDT' },
      { label: 'Stakeholder Approval Rate', value: '68%' }
    ],
    gaps: ['Long-term sustainability data is still under review.'],
    synthesis: 'The research indicates a strong alignment with regional energy goals but highlights potential bottlenecks in infrastructure development.',
    createdAt: new Date().toISOString(),
  };
  researchSessions.push(newSession);
  return created(res, { ...newSession, generatedAt: new Date().toISOString() });
});

/**
 * @swagger
 * /research/{articleId}:
 *   get:
 *     summary: List research sessions for an article
 *     tags: [Research — Steps 2 & 3]
 */
router.get('/:articleId', (req, res) => {
  const sessions = researchSessions.filter(s => s.articleId === req.params.articleId);
  return ok(res, sessions);
});

/**
 * @swagger
 * /research/session/{id}:
 *   get:
 *     summary: Get a single research session
 *     tags: [Research — Steps 2 & 3]
 */
router.get('/session/:id', (req, res) => {
  const session = researchSessions.find(s => s.id === req.params.id);
  if (!session) return notFound(res, 'Session not found');
  return ok(res, session);
});

export default router;
