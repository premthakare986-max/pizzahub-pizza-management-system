import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbState } from '../services/relationalStore.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'pizzahub_super_secret_jwt_key_2026_dbms_project';

export interface AuthPayload {
  userId: number;
  email: string;
  role: 'customer' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in with a valid Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    const userExists = dbState.users.find((u) => u.id === decoded.userId && u.is_active === 1);
    if (!userExists) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer active or not found.',
      });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired JWT token. Please log in again.',
    });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Administrator privileges are required for this operation.',
    });
  }
  next();
}
