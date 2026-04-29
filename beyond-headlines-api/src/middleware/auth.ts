import { Request, Response, NextFunction } from 'express';
import { unauthorized, badRequest } from '../utils/response';

declare global {
  namespace Express {
    interface Response {
      locals: {
        laravelUserEmail?: string;
      };
    }
  }
}

/**
 * Unified Service-to-Service Authentication Middleware (Laravel → API)
 * 
 * Required on every request:
 * 1. Header: X-API-Token (hardcoded secret shared with Laravel)
 * 2. Payload: email (user identifier) — prioritized from body, fallback to query
 * 
 * Response will automatically include the email field via response helpers.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // 1. Validate API token in header
  const apiToken = req.headers['x-api-token'] as string;
  const expectedToken = process.env.LARAVEL_API_TOKEN || '';

  if (!apiToken || apiToken !== expectedToken) {
    return unauthorized(res, 'Invalid or missing API token');
  }

  // 2. Extract email from request body or query (for GET compatibility)
  const email = (req.body as any)?.email || (req.query as any)?.email;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({
      error: 'Email is required in request body or query parameter',
      code: 'MISSING_EMAIL',
    });
  }

  // 3. Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format',
      code: 'INVALID_EMAIL',
    });
  }

  // Store in res.locals so response helpers can include it in all responses
  res.locals.laravelUserEmail = email;

  next();
};

// Aliases for compatibility with existing route definitions, 
// though roles are now managed on the Laravel side.
export const requireEditorOrAdmin = authenticate;
export const requireAdmin = authenticate;
