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
 *     tags: [Step 02 & 03 - Research]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               clusterId: { type: string }
 *             required: [email, clusterId]
 */
router.post('/topic-brief', authenticate, validate(topicBriefSchema), async (req, res) => {
  const cluster = await db.cluster.findUnique({
    where:   { id: req.body.clusterId },
    include: { headlines: { take: 20 } },
  });
  if (!cluster) return notFound(res, 'Cluster not found');

  // Return cached brief if available to ensure stability
  if (cluster.brief) {
    return ok(res, cluster.brief);
  }

  const headlines = cluster.headlines.map((h: any) => h.headline);
  const result    = await generateTopicBrief(cluster.summary, headlines);

  // Cache the brief in the database
  await db.cluster.update({
    where: { id: req.body.clusterId },
    data:  { brief: result as any },
  });

  return created(res, result);
});

/**
 * @swagger
 * /research/generate:
 *   post:
 *     summary: Queue a full research session (Perplexity + Haiku)
 *     tags: [Step 02 & 03 - Research]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResearchGenerateRequest'
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
 *     tags: [Step 02 & 03 - Research]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/emailParam'
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema:
 *           type: string
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
 *     tags: [Step 02 & 03 - Research]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/emailParam'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/session/:id', authenticate, async (req, res) => {
  const session = await db.researchSession.findUnique({ where: { id: req.params.id } });
  if (!session) return notFound(res, 'Session not found');
  return ok(res, session);
});

export default router;
