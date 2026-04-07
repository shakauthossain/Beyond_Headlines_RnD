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
 */
router.get('/', async (req, res) => {
  const { status, categoryId, authorId, page = 1, limit = 20 } = req.query;
  
  const where: any = {};
  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (authorId) where.authorId = authorId;

  const [total, data] = await Promise.all([
    db.article.count({ where }),
    db.article.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { updatedAt: 'desc' },
      include: { category: true, author: { select: { id: true, name: true, role: true } } }
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
 */
router.get('/:id', async (req, res) => {
  const article = await db.article.findFirst({
    where: {
      OR: [
        { id: req.params.id },
        { slug: req.params.id }
      ]
    },
    include: { category: true, author: { select: { id: true, name: true, role: true } } }
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
 */
router.post('/', authenticate, validate(articleCreateSchema), async (req: Request, res: Response) => {
  const slug = req.body.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  
  const newArticle = await db.article.create({
    data: {
      ...req.body,
      slug,
      status: 'DRAFT',
      authorId: req.user!.id,
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
 */
router.post('/:id/autosave', authenticate, validate(revisionCreateSchema), async (req, res) => {
  const newRevision = await db.revision.create({
    data: {
      articleId: req.params.id,
      body: req.body.body,
      title: req.body.title,
      authorId: req.user!.id,
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
 */
router.post('/:id/assist', authenticate, async (req, res) => {
  const { mode, text } = req.body;
  const article = await db.article.findUnique({ where: { id: req.params.id } });
  if (!article) return notFound(res, 'Article not found');

  let result;
  switch (mode) {
    case 'outline':
      result = await generateOutline(article.angle || '', article.tone || 'ANALYTICAL');
      break;
    case 'assist':
      result = await inlineAssist(text, article.tone || 'ANALYTICAL');
      break;
    case 'counterpoint':
      result = await generateCounterpoint(text);
      break;
    default:
      return res.status(400).json({ message: 'Invalid assist mode' });
  }
  return ok(res, result);
});

/**
 * @swagger
 * /articles/{id}/sub-edit:
 *   post:
 *     summary: AI Sub-editing (Clarity, Tone, Flow)
 *     tags: [Articles]
 */
router.post('/:id/sub-edit', authenticate, async (req, res) => {
  const article = await db.article.findUnique({ where: { id: req.params.id } });
  if (!article) return notFound(res, 'Article not found');

  const result = await subEditArticle(JSON.stringify(article.body));
  return ok(res, result);
});

/**
 * @swagger
 * /articles/{id}/headlines-score:
 *   post:
 *     summary: AI Headline scoring
 *     tags: [Articles]
 */
router.post('/:id/headlines-score', authenticate, async (req, res) => {
  const { headlines } = req.body;
  if (!headlines || !Array.isArray(headlines)) return res.status(400).json({ message: 'Headlines array required' });

  const result = await scoreHeadlines(headlines);
  return ok(res, result);
});

/**
 * @swagger
 * /articles/{id}/packaging:
 *   post:
 *     summary: AI Article packaging (Image concept, Social captions)
 *     tags: [Articles]
 */
router.post('/:id/packaging', authenticate, async (req, res) => {
  const article = await db.article.findUnique({ where: { id: req.params.id } });
  if (!article) return notFound(res, 'Article not found');

  const result = await generatePackaging(article.title, JSON.stringify(article.body));
  return ok(res, result);
});

export default router;





