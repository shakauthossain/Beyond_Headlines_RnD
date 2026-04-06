import { Router, Request, Response } from 'express';
import { articles, revisions } from '../data/mockData';
import { articleCreateSchema, articleUpdateSchema, revisionCreateSchema } from '../types/article.types';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ok, created, noContent, notFound, list } from '../utils/response';
import { Article } from '../types';

const router = Router();

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: List articles with filters
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of articles
 */
router.get('/', (req, res) => {
  const { status, categoryId, authorId, page = 1, limit = 20 } = req.query;
  
  let filtered = [...articles];
  if (status) filtered = filtered.filter(a => a.status === status);
  if (categoryId) filtered = filtered.filter(a => a.categoryId === categoryId);
  if (authorId) filtered = filtered.filter(a => a.authorId === authorId);

  const total = filtered.length;
  const start = (Number(page) - 1) * Number(limit);
  const data = filtered.slice(start, start + Number(limit));

  return list(res, data, total, Number(page), Number(limit));
});

/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: Get article by ID or slug
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article data
 *       404:
 *         description: Not found
 */
router.get('/:id', (req, res) => {
  const article = articles.find(a => a.id === req.params.id || a.slug === req.params.id);
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
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ArticleCreate'
 *     responses:
 *       201:
 *         description: Article created
 */
router.post('/', authenticate, validate(articleCreateSchema), (req: Request, res: Response) => {
  const newArticle: Article = {
    id: `a${articles.length + 1}`,
    ...req.body,
    slug: req.body.title.toLowerCase().replace(/ /g, '-'),
    status: 'DRAFT',
    authorId: req.user!.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  articles.push(newArticle);
  return created(res, newArticle);
});

/**
 * @swagger
 * /articles/{id}:
 *   patch:
 *     summary: Update an article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Article updated
 */
router.patch('/:id', authenticate, validate(articleUpdateSchema), (req, res) => {
  const index = articles.findIndex(a => a.id === req.params.id);
  if (index === -1) return notFound(res, 'Article not found');

  articles[index] = {
    ...articles[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  return ok(res, articles[index]);
});

/**
 * @swagger
 * /articles/{id}:
 *   delete:
 *     summary: Delete an article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Success
 */
router.delete('/:id', authenticate, (req, res) => {
  const index = articles.findIndex(a => a.id === req.params.id);
  if (index === -1) return notFound(res, 'Article not found');
  articles.splice(index, 1);
  return noContent(res);
});

/**
 * @swagger
 * /articles/{id}/revisions:
 *   get:
 *     summary: Get revision history
 *     tags: [Articles]
 *     responses:
 *       200:
 *         description: Revision history
 */
router.get('/:id/revisions', (req, res) => {
  const history = revisions.filter(r => r.articleId === req.params.id);
  return ok(res, history);
});

/**
 * @swagger
 * /articles/{id}/autosave:
 *   post:
 *     summary: Create an autosave revision
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Revision created
 */
router.post('/:id/autosave', authenticate, validate(revisionCreateSchema), (req, res) => {
  const newRevision = {
    id: `r${revisions.length + 1}`,
    articleId: req.params.id,
    content: req.body.content,
    authorId: req.user!.id,
    createdAt: new Date().toISOString(),
  };
  revisions.push(newRevision);
  return created(res, newRevision);
});

export default router;
