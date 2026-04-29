import { Router } from 'express';
import {
  generateOutline,
  inlineAssist,
  generateCounterpoint,
  subEditArticle,
  scoreHeadlines,
  generateSEOMetadata,
  generatePackaging,
} from '../services/ai.service';
import { db } from '../db/client';
import {
  outlineSchema,
  inlineAssistSchema,
  counterpointSchema,
  headlineScoreSchema,
  simpleArticleIdSchema,
} from '../types/ai.types';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ok, notFound } from '../utils/response';

const router = Router();

// Helper: get article body as string for AI calls
const getArticleBody = async (articleId: string) => {
  const article = await db.article.findUnique({ where: { id: articleId } });
  if (!article) return null;
  const bodyText = typeof article.body === 'string'
    ? article.body
    : JSON.stringify(article.body);
  return { article, bodyText };
};

/**
 * @swagger
 * /ai/outline:
 *   post:
 *     summary: Generate an article outline (Claude Sonnet)
 *     tags: [Step 04 - Drafting]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               articleId: { type: string }
 *               angle: { type: string }
 *               tone: { type: string, enum: [ANALYTICAL, CRITICAL, EXPLANATORY] }
 *             required: [email, articleId]
 */
router.post('/outline', authenticate, validate(outlineSchema), async (req, res) => {
  const result = await generateOutline(req.body.angle ?? '', req.body.tone ?? 'ANALYTICAL', req.body.sources);
  return ok(res, result);
});

/**
 * @swagger
 * /ai/inline-assist:
 *   post:
 *     summary: Improve a paragraph inline (Claude Sonnet)
 *     tags: [Step 04 - Drafting]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               articleId: { type: string }
 *               paragraph: { type: string }
 *               tone: { type: string, enum: [ANALYTICAL, CRITICAL, EXPLANATORY] }
 *             required: [email, articleId, paragraph]
 */
router.post('/inline-assist', authenticate, validate(inlineAssistSchema), async (req, res) => {
  const result = await inlineAssist(req.body.paragraph, req.body.tone ?? 'ANALYTICAL');
  return ok(res, result);
});

/**
 * @swagger
 * /ai/counterpoint:
 *   post:
 *     summary: Steelman the opposing position (Claude Sonnet)
 *     tags: [Step 04 - Drafting]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               articleId: { type: string }
 *               paragraph: { type: string }
 *             required: [email, articleId, paragraph]
 */
router.post('/counterpoint', authenticate, validate(counterpointSchema), async (req, res) => {
  const result = await generateCounterpoint(req.body.paragraph);
  return ok(res, result);
});

/**
 * @swagger
 * /ai/sub-edit:
 *   post:
 *     summary: Full sub-edit analysis (Claude Sonnet)
 *     tags: [Step 05 - Sub-editing]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               articleId: { type: string }
 *             required: [email, articleId]
 */
router.post('/sub-edit', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  const data = await getArticleBody(req.body.articleId);
  if (!data) return notFound(res, 'Article not found');
  const result = await subEditArticle(data.bodyText);
  return ok(res, result);
});

/**
 * @swagger
 * /ai/seo-metadata:
 *   post:
 *     summary: Generate SEO metadata (Claude Haiku)
 *     tags: [Step 05 - Sub-editing]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               articleId: { type: string }
 *             required: [email, articleId]
 */
router.post('/seo-metadata', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  const data = await getArticleBody(req.body.articleId);
  if (!data) return notFound(res, 'Article not found');
  const result = await generateSEOMetadata(data.article.title, data.bodyText.substring(0, 600));
  return ok(res, result);
});

/**
 * @swagger
 * /ai/score-headlines:
 *   post:
 *     summary: Score up to 3 headlines (Claude Sonnet)
 *     tags: [Step 05 - Sub-editing]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               headlines: { type: array, items: { type: string }, maxItems: 3 }
 *             required: [email, headlines]
 */
router.post('/score-headlines', authenticate, validate(headlineScoreSchema), async (req, res) => {
  const result = await scoreHeadlines(req.body.headlines);
  return ok(res, result);
});

/**
 * @swagger
 * /ai/packaging:
 *   post:
 *     summary: Full packaging suite (Claude Haiku)
 *     tags: [Step 06 - Packaging]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               articleId: { type: string }
 *             required: [email, articleId]
 */
router.post('/packaging', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  const data = await getArticleBody(req.body.articleId);
  if (!data) return notFound(res, 'Article not found');
  const result = await generatePackaging(data.article.title, data.bodyText);
  return ok(res, result);
});

/**
 * @swagger
 * /ai/image-concept:
 *   post:
 *     summary: Image concept only (Claude Haiku)
 *     tags: [Step 06 - Packaging]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               articleId: { type: string }
 *             required: [email, articleId]
 */
router.post('/image-concept', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  const data = await getArticleBody(req.body.articleId);
  if (!data) return notFound(res, 'Article not found');
  const pkg = await generatePackaging(data.article.title, data.bodyText);
  return ok(res, { concept: pkg.image_concept, generatedAt: pkg.generatedAt });
});

/**
 * @swagger
 * /ai/social-captions:
 *   post:
 *     summary: Social captions only (Claude Haiku)
 *     tags: [Step 06 - Packaging]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               articleId: { type: string }
 *             required: [email, articleId]
 */
router.post('/social-captions', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  const data = await getArticleBody(req.body.articleId);
  if (!data) return notFound(res, 'Article not found');
  const pkg = await generatePackaging(data.article.title, data.bodyText);
  return ok(res, { social_captions: pkg.social_captions, generatedAt: pkg.generatedAt });
});

/**
 * @swagger
 * /ai/pull-quotes:
 *   post:
 *     summary: Pull quotes only (Claude Haiku)
 *     tags: [Step 06 - Packaging]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               articleId: { type: string }
 *             required: [email, articleId]
 */
router.post('/pull-quotes', authenticate, validate(simpleArticleIdSchema), async (req, res) => {
  const data = await getArticleBody(req.body.articleId);
  if (!data) return notFound(res, 'Article not found');
  const pkg = await generatePackaging(data.article.title, data.bodyText);
  return ok(res, { pull_quotes: pkg.pull_quotes, generatedAt: pkg.generatedAt });
});

export default router;
