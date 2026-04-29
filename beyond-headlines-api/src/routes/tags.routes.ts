import { Router } from 'express';
import { tags } from '../data/mockData';
import { tagCreateSchema } from '../types/article.types';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { ok, created } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /tags:
 *   get:
 *     summary: List all tags
 *     tags: [Tags]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/emailParam'
 *     responses:
 *       200:
 *         description: List of tags
 */
router.get('/', (req, res) => {
  return ok(res, tags);
});

/**
 * @swagger
 * /tags:
 *   post:
 *     summary: Create a tag
 *     tags: [Tags]
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
 *             required: [email, name]
 *     responses:
 *       201:
 *         description: Tag created
 */
router.post('/', authenticate, validate(tagCreateSchema), (req, res) => {
  const newTag = {
    id: `${tags.length + 1}`,
    ...req.body,
    slug: req.body.slug || req.body.name.toLowerCase().replace(/ /g, '-'),
  };
  tags.push(newTag);
  return created(res, newTag);
});

export default router;
