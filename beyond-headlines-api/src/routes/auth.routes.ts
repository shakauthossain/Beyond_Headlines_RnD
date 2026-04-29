import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /auth:
 *   get:
 *     summary: API authentication info (no separate auth endpoints)
 *     description: |
 *       All API endpoints use unified service-to-service authentication.
 *       Every request requires:
 *       - Header: X-API-Token (hardcoded from Laravel)
 *       - Body: { email: "user@example.com", ... }
 *       
 *       Every response includes the email field.
 *     tags: [Auth]
 *     security:
 *       - apiToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/emailParam'
 *     responses:
 *       200:
 *         description: API authentication method info
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Beyond Headlines API uses unified service-to-service authentication',
    method: 'Laravel integration',
    requirements: {
      header: 'X-API-Token (hardcoded token from Laravel)',
      body: 'email field required with all requests'
    }
  });
});

export default router;
