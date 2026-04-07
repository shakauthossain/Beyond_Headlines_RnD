import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { unauthorized, forbidden } from '../utils/response';
import { db } from '../db/client';
import { User } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(res);
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token) as { email: string };
    const user = await db.user.findUnique({
      where: { email: payload.email },
    });
    
    if (!user) {
      return unauthorized(res);
    }

    // Remove password
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword as User;
    next();
  } catch (error) {
    return unauthorized(res);
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return forbidden(res);
    }
    next();
  });
};
