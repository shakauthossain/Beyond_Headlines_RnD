import { Router } from 'express';
import { db } from '../db/client';
import { researchQueue } from '../workers/queue';
import { topicBriefSchema, researchGenerateSchema } from '../types/ai.types';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';
import { generateTopicBrief } from '../services/ai.service';

const router = Router();

/**
 * @swagger
 * /research/topic-brief:
 *   post:
 *     summary: Generate an AI topic brief (Claude Sonnet)
 *     tags: [Research — Steps 2 & 3]
 */
router.post('/topic-brief', authenticate, validate(topicBriefSchema), async (req, res) => {
  const cluster = await db.cluster.findUnique({
    where:   { id: req.body.clusterId },
    include: { headlines: { take: 20 } },
  });
  if (!cluster) return notFound(res, 'Cluster not found');

  const headlines = cluster.headlines.map((h: any) => h.headline);
  const result    = await generateTopicBrief(cluster.summary, headlines);
  return created(res, result);
});

/**
 * @swagger
 * /research/generate:
 *   post:
 *     summary: Queue a full research session (Perplexity + Haiku)
 *     tags: [Research — Steps 2 & 3]
 */
router.post('/generate', authenticate, validate(researchGenerateSchema), async (req, res) => {
  const { articleId, angle } = req.body;

  const article = await db.article.findUnique({ where: { id: articleId } });
  if (!article) return notFound(res, 'Article not found');

  // Queue the research job — returns immediately; worker handles the AI work
  const job = await researchQueue.add('research-session', { articleId, angle: angle ?? article.angle ?? '' });
  return created(res, {
    jobId:     job.id,
    status:    'QUEUED',
    articleId,
    message:   'Research session queued. Poll GET /research/:articleId for results.',
  });
});

/**
 * @swagger
 * /research/{articleId}:
 *   get:
 *     summary: All research sessions for an article
 *     tags: [Research — Steps 2 & 3]
 */
router.get('/:articleId', authenticate, async (req, res) => {
  const sessions = await db.researchSession.findMany({
    where:   { articleId: req.params.articleId },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, sessions);
});

/**
 * @swagger
 * /research/session/{id}:
 *   get:
 *     summary: Get a single research session
 *     tags: [Research — Steps 2 & 3]
 */
router.get('/session/:id', authenticate, async (req, res) => {
  const session = await db.researchSession.findUnique({ where: { id: req.params.id } });
  if (!session) return notFound(res, 'Session not found');
  return ok(res, session);
});

export default router;
