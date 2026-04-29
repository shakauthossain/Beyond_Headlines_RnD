import { Router, Request, Response } from 'express';
import { db } from '../db/client';
import { articleCreateSchema, articleUpdateSchema, revisionCreateSchema } from '../types/article.types';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ok, created, noContent, notFound, list } from '../utils/response';
import { 
  generateOutline, 
  inlineAssist, 
  generateCounterpoint, 
  completeSectionsDraft,
  conversationalRewrite,
  completeSingleSection,
  rewriteSingleSection,
  subEditArticle, 
  scoreHeadlines,
  generatePackaging 
} from '../services/ai.service';

const router = Router();

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: List articles with filters
 *     tags: [Articles]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - $ref: '#/components/parameters/emailParam'
 */
router.get('/', async (req, res) => {
  const { status, categoryId, authorEmail, page = 1, limit = 20 } = req.query;
  
  const where: any = {};
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (authorEmail) where.authorEmail = authorEmail;

  const [total, data] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { updatedAt: 'desc' },
      include: { category: true }
    })
  ]);

  return list(res, data, total, Number(page), Number(limit));
});

/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: Get article by ID or slug
 *     tags: [Articles]
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
router.get('/:id', async (req, res) => {
  const article = await db.article.findFirst({
    where: {
      OR: [
        { id: req.params.id },
        { slug: req.params.id }
      ]
    },
    include: { category: true }
  });

  if (!article) return notFound(res, 'Article not found');
  return ok(res, article);
});


/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create new article
 *     tags: [Articles]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArticleCreateRequest'
 *     responses:
 *       201:
 *         description: Article created
 */
router.post('/', authenticate, validate(articleCreateSchema), async (req: Request, res: Response) => {
  const slug = req.body.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  
  const newArticle = await db.article.create({
    data: {
      ...req.body,
      slug,
      status: 'DRAFT',
      authorEmail: res.locals.laravelUserEmail!,
    }
  });

  return created(res, newArticle);
});

/**
 * @swagger
 * /articles/{id}:
 *   patch:
 *     summary: Update an article
 *     tags: [Articles]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArticleUpdateRequest'
 */
router.patch('/:id', authenticate, validate(articleUpdateSchema), async (req, res) => {
  try {
    const article = await db.article.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        updatedAt: new Date().toISOString(),
      },
    });
    return ok(res, article);
  } catch (err) {
    return notFound(res, 'Article not found');
  }
});

/**
 * @swagger
 * /articles/{id}:
 *   delete:
 *     summary: Delete an article
 *     tags: [Articles]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - $ref: '#/components/parameters/emailParam'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.article.delete({ where: { id: req.params.id } });
    return noContent(res);
  } catch (err) {
    return notFound(res, 'Article not found');
  }
});

/**
 * @swagger
 * /articles/{id}/revisions:
 *   get:
 *     summary: Get revision history
 *     tags: [Articles]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - $ref: '#/components/parameters/emailParam'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id/revisions', async (req, res) => {
  const history = await db.revision.findMany({
    where: { articleId: req.params.id },
    orderBy: { savedAt: 'desc' }
  });
  return ok(res, history);
});

/**
 * @swagger
 * /articles/{id}/autosave:
 *   post:
 *     summary: Create an autosave revision
 *     tags: [Articles]
 *     security:
 *       - apiToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RevisionRequest'
 */
router.post('/:id/autosave', authenticate, validate(revisionCreateSchema), async (req, res) => {
  const newRevision = await db.revision.create({
    data: {
      articleId: req.params.id,
      body: req.body.body,
      title: req.body.title,
      authorEmail: res.locals.laravelUserEmail!,
    }
  });
  return created(res, newRevision);
});

/**
 * @swagger
 * /articles/{id}/assist:
 *   post:
 *     summary: AI Assistance for drafting (Outline, Assist, Counterpoint)
 *     tags: [Articles]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - in: path
 *         name: id
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
 *               mode: { type: string, enum: [outline, assist, counterpoint, complete_sections, conversational, complete_section, rewrite_section] }
 *               text: { type: string }
 *               prompt: { type: string }
 *               sectionTitle: { type: string }
 *               sectionNote: { type: string }
 *               sectionBody: { type: string }
 *             required: [email, mode]
 */
router.post('/:id/assist', authenticate, async (req, res) => {
  try {
    const { mode, text, prompt, sectionTitle, sectionNote, sectionBody } = req.body;
    const article = await db.article.findUnique({ where: { id: req.params.id } });
    if (!article) return notFound(res, 'Article not found');

    if ((mode === 'assist' || mode === 'counterpoint' || mode === 'complete_sections' || mode === 'conversational')
      && (!text || typeof text !== 'string' || !text.trim())) {
      return res.status(400).json({ message: 'Please select text before running this assist action.' });
    }

    if (mode === 'complete_section' && (!sectionTitle || typeof sectionTitle !== 'string')) {
      return res.status(400).json({ message: 'sectionTitle is required for section completion.' });
    }

    if (mode === 'rewrite_section' && (!sectionTitle || !sectionBody || !prompt)) {
      return res.status(400).json({ message: 'sectionTitle, sectionBody and prompt are required for section rewrite.' });
    }

    if (mode === 'conversational' && (!prompt || typeof prompt !== 'string' || !prompt.trim())) {
      return res.status(400).json({ message: 'Prompt is required for conversational rewrite.' });
    }

    const latestResearch = await db.researchSession.findFirst({
      where: { articleId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });

    const sources = Array.isArray(latestResearch?.sources) ? (latestResearch?.sources as any[]) : [];
    const timeline = Array.isArray(latestResearch?.timeline) ? (latestResearch?.timeline as any[]) : [];
    const dataPoints = Array.isArray(latestResearch?.dataPoints) ? (latestResearch?.dataPoints as any[]) : [];

    const sourceHints = sources
      .map((s: any) => (typeof s?.url === 'string' ? s.url : typeof s?.title === 'string' ? s.title : null))
      .filter(Boolean) as string[];

    const timelineHints = timeline
      .slice(0, 5)
      .map((t: any) => `${t?.date || 'N/A'}: ${t?.event || ''}`)
      .join('\n');

    const dataPointHints = dataPoints
      .slice(0, 5)
      .map((d: any) => `${d?.metric || 'Metric'} = ${d?.value || 'N/A'} (${d?.context || 'context'})`)
      .join('\n');

    const researchContext = [
      latestResearch?.angle ? `Research Angle: ${latestResearch.angle}` : '',
      timelineHints ? `Timeline:\n${timelineHints}` : '',
      dataPointHints ? `Data Points:\n${dataPointHints}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    let result;
    switch (mode) {
      case 'outline':
        result = await generateOutline(
          [article.angle || article.title || '', researchContext].filter(Boolean).join('\n\n'),
          article.tone || 'ANALYTICAL',
          sourceHints,
        );
        break;
      case 'assist':
        result = await inlineAssist(text, article.tone || 'ANALYTICAL');
        break;
      case 'counterpoint':
        result = await generateCounterpoint(text);
        break;
      case 'complete_sections':
        result = await completeSectionsDraft(text, article.tone || 'ANALYTICAL');
        break;
      case 'conversational':
        result = await conversationalRewrite(text, prompt, article.tone || 'ANALYTICAL');
        break;
      case 'complete_section':
        result = await completeSingleSection(
          sectionTitle,
          typeof sectionNote === 'string' ? sectionNote : '',
          typeof sectionBody === 'string' ? sectionBody : '',
          article.tone || 'ANALYTICAL',
          researchContext,
        );
        break;
      case 'rewrite_section':
        result = await rewriteSingleSection(
          sectionTitle,
          sectionBody,
          prompt,
          article.tone || 'ANALYTICAL',
        );
        break;
      default:
        return res.status(400).json({ message: 'Invalid assist mode' });
    }
    return ok(res, result);
  } catch (err: any) {
    console.error('[Articles Route] /assist failed:', err?.message || err);

    // Keep the editor usable even when model output is malformed.
    if (req.body?.mode === 'outline') {
      const fallback = {
        sections: [
          { label: 'What Happened', direction: 'Summarize the latest development in 3-4 crisp lines.' },
          { label: 'Why It Matters', direction: 'Explain impact on Bangladesh households, prices, and policy.' },
          { label: 'Key Evidence', direction: 'Add strongest data points, dates, and source-backed facts.' },
          { label: 'Counterview', direction: 'Present the strongest competing interpretation fairly.' },
          { label: 'What Comes Next', direction: 'Close with realistic scenarios and what to monitor next.' },
        ],
        generatedAt: new Date().toISOString(),
      };
      return ok(res, fallback);
    }

    return res.status(502).json({ message: 'AI assist temporarily unavailable. Please retry.' });
  }
});

/**
 * @swagger
 * /articles/{id}/sub-edit:
 *   post:
 *     summary: AI Sub-editing (Clarity, Tone, Flow)
 *     tags: [Articles]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - in: path
 *         name: id
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
 *             required: [email]
 */
router.post('/:id/sub-edit', authenticate, async (req, res) => {
  const article = await db.article.findUnique({ where: { id: req.params.id } });
  if (!article) return notFound(res, 'Article not found');

  if (article.subEditReport) return ok(res, article.subEditReport);

  const result = await subEditArticle(JSON.stringify(article.body));

  await db.article.update({
    where: { id: req.params.id },
    data: { subEditReport: result as any }
  });

  return ok(res, result);
});

/**
 * @swagger
 * /articles/{id}/headlines-score:
 *   post:
 *     summary: AI Headline scoring
 *     tags: [Articles]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - in: path
 *         name: id
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
 *               headlines: { type: array, items: { type: string } }
 *             required: [email, headlines]
 */
router.post('/:id/headlines-score', authenticate, async (req, res) => {
  const { headlines } = req.body;
  if (!headlines || !Array.isArray(headlines)) return res.status(400).json({ message: 'Headlines array required' });

  // For scoring, we always run it because the user might have changed the inputs,
  // but we store the latest one for UI persistence on reload.
  const result = await scoreHeadlines(headlines);

  await db.article.update({
    where: { id: req.params.id },
    data: { headlineScores: result as any }
  });

  return ok(res, result);
});

/**
 * @swagger
 * /articles/{id}/packaging:
 *   post:
 *     summary: AI Article packaging (Image concept, Social captions)
 *     tags: [Articles]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/apiTokenParam'
 *       - in: path
 *         name: id
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
 *             required: [email]
 */
router.post('/:id/packaging', authenticate, async (req, res) => {
  const article = await db.article.findUnique({ where: { id: req.params.id } });
  if (!article) return notFound(res, 'Article not found');

  if (article.packaging) return ok(res, article.packaging);

  const result = await generatePackaging(article.title, JSON.stringify(article.body));

  await db.article.update({
    where: { id: req.params.id },
    data: { packaging: result as any }
  });

  return ok(res, result);
});

export default router;





