import { Router } from 'express';
import { users } from '../data/mockData';
import { userCreateSchema, userUpdateSchema } from '../types/user.types';
import { validate } from '../middleware/validate';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ok, created, noContent, notFound } from '../utils/response';

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 */
router.get('/', authenticate, (req, res) => {
  return ok(res, users);
});

router.get('/:id', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return notFound(res, 'User not found');
  return ok(res, user);
});

router.post('/', requireAdmin, validate(userCreateSchema), (req, res) => {
  const newUser = { id: `${users.length + 1}`, ...req.body };
  users.push(newUser);
  return created(res, newUser);
});

router.patch('/:id', requireAdmin, validate(userUpdateSchema), (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return notFound(res, 'User not found');
  users[index] = { ...users[index], ...req.body };
  return ok(res, users[index]);
});

router.delete('/:id', requireAdmin, (req, res) => {
  const index = users.findIndex(u => u.id === req.params.id);
  if (index === -1) return notFound(res, 'User not found');
  users.splice(index, 1);
  return noContent(res);
});

export default router;
