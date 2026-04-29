import { Router } from 'express';
import { categories } from '../data/mockData';
import { categoryCreateSchema } from '../types/article.types';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ok, created, notFound } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/emailParam'
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', (req, res) => {
  return ok(res, categories);
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a category
 *     tags: [Categories]
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
 *               name: { type: string }
 *               slug: { type: string }
 *               parentId: { type: string }
 *             required: [email, name]
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/', authenticate, validate(categoryCreateSchema), (req, res) => {
  const newCat = {
    id: `${categories.length + 1}`,
    ...req.body,
    slug: req.body.slug || req.body.name.toLowerCase().replace(/ /g, '-'),
  };
  categories.push(newCat);
  return created(res, newCat);
});

export default router;
