import { Router } from 'express';
import bcrypt from 'bcrypt';
import { loginSchema } from '../types/user.types';
import { validate } from '../middleware/validate';
import { db } from '../db/client';
import { signToken } from '../utils/jwt';
import { ok, unauthorized } from '../utils/response';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Unauthorized
 */
router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  
  const user = await db.user.findUnique({
    where: { email },
  });
  
  if (!user) {
    return unauthorized(res);
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return unauthorized(res);
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  const token = signToken({ email: user.email, role: user.role });
  return ok(res, { token, user: userWithoutPassword });
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, (req, res) => {
  return ok(res, req.user);
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Success message
 */
router.post('/logout', (req, res) => {
  return ok(res, { message: 'Logged out successfully' });
});

export default router;
