import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { redis } from '../redis/client';
import { makeKey, setCached } from '../redis/cache';
import { authenticate } from '../middleware/auth';

/**
 * @swagger
 * /admin/source-language-mappings:
 *   get:
 *     summary: Get all source language mappings
 *     description: Retrieve all configured source language mappings for news sources
 *     tags:
 *       - Admin
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/emailParam'
 *     responses:
 *       200:
 *         description: List of source language mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SourceLanguageMapping'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /admin/source-language-mappings/{source}:
 *   get:
 *     summary: Get language mapping for a specific source
 *     tags:
 *       - Admin
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/emailParam'
 *       - in: path
 *         name: source
 *         required: true
 *         schema:
 *           type: string
 *         description: Source name (e.g., PROTHOM_ALO)
 *     responses:
 *       200:
 *         description: Language mapping details
 *       404:
 *         description: Source not found
 */

/**
 * @swagger
 * /admin/source-language-mappings/{source}:
 *   put:
 *     summary: Update language mapping for a source
 *     description: Update English domain, language strategy, and other settings for a news source
 *     tags:
 *       - Admin
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - in: path
 *         name: source
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               englishDomain: { type: string }
 *               bengaliDomain: { type: string }
 *               languageStrategy: { type: string, enum: [ENGLISH_FIRST, BENGALI_FIRST, ENGLISH_ONLY, BENGALI_ONLY] }
 *               hasEnglishEdition: { type: boolean }
 *               fallbackEnabled: { type: boolean }
 *               isActive: { type: boolean }
 *               description: { type: string }
 *             required: [email]
 *     responses:
 *       200:
 *         description: Updated mapping
 *       404:
 *         description: Source not found
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SourceLanguageMapping:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         source:
 *           type: string
 *           example: "PROTHOM_ALO"
 *         bengaliDomain:
 *           type: string
 *           example: "prothomalo.com"
 *         englishDomain:
 *           type: string
 *           example: "en.prothomalo.com"
 *         languageStrategy:
 *           type: string
 *           enum: [ENGLISH_FIRST, BENGALI_FIRST, ENGLISH_ONLY, BENGALI_ONLY]
 *         hasEnglishEdition:
 *           type: boolean
 *         fallbackEnabled:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         description:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const router = Router();

// Middleware to check service-to-service auth (token + email already validated by authenticate middleware)
const serviceAccess = (req: Request, res: Response, next: Function) => {
  if (!res.locals.laravelUserEmail) {
    return res.status(401).json({ error: 'Service authentication required' });
  }
  next();
};

// Get all source language mappings
router.get('/', authenticate, serviceAccess, async (req: Request, res: Response) => {
  try {
    const mappings = await db.sourceLanguageMapping.findMany({
      orderBy: { source: 'asc' },
    });
    res.json({ data: mappings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific source language mapping
router.get('/:source', authenticate, serviceAccess, async (req: Request, res: Response) => {
  try {
    const mapping = await db.sourceLanguageMapping.findUnique({
      where: { source: req.params.source },
    });
    if (!mapping) {
      return res.status(404).json({ error: 'Source not found' });
    }
    res.json(mapping);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update source language mapping
router.put('/:source', authenticate, serviceAccess, async (req: Request, res: Response) => {
  try {
    const {
      bengaliDomain,
      englishDomain,
      languageStrategy,
      hasEnglishEdition,
      fallbackEnabled,
      isActive,
      description,
    } = req.body;

    const mapping = await db.sourceLanguageMapping.update({
      where: { source: req.params.source },
      data: {
        ...(bengaliDomain && { bengaliDomain }),
        ...(englishDomain && { englishDomain }),
        ...(languageStrategy && { languageStrategy }),
        ...(hasEnglishEdition !== undefined && { hasEnglishEdition }),
        ...(fallbackEnabled !== undefined && { fallbackEnabled }),
        ...(isActive !== undefined && { isActive }),
        ...(description && { description }),
      },
    });

    // Invalidate cache so next fetch gets fresh data
    const cacheKey = makeKey('admin', 'source_language_mappings');
    await redis.del(cacheKey);

    res.json({
      message: 'Source language mapping updated successfully',
      data: mapping,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Source not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Create new source language mapping (if needed)
router.post('/', authenticate, serviceAccess, async (req: Request, res: Response) => {
  try {
    const {
      source,
      bengaliDomain,
      englishDomain,
      languageStrategy = 'ENGLISH_FIRST',
      hasEnglishEdition = true,
      fallbackEnabled = true,
      description,
    } = req.body;

    if (!source || !bengaliDomain || !englishDomain) {
      return res.status(400).json({
        error: 'Missing required fields: source, bengaliDomain, englishDomain',
      });
    }

    const mapping = await db.sourceLanguageMapping.create({
      data: {
        source,
        bengaliDomain,
        englishDomain,
        languageStrategy,
        hasEnglishEdition,
        fallbackEnabled,
        isActive: true,
        description,
      },
    });

    // Invalidate cache
    const cacheKey = makeKey('admin', 'source_language_mappings');
    await redis.del(cacheKey);

    res.status(201).json({
      message: 'Source language mapping created successfully',
      data: mapping,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Source already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
