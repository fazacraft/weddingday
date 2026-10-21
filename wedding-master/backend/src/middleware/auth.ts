import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-secret-change-me';
const TOKEN_TTL = '30d';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

export interface AuthedRequest extends Request {
  userId?: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function readUserId(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    return typeof payload === 'object' && typeof payload.sub === 'string'
      ? payload.sub
      : undefined;
  } catch {
    return undefined;
  }
}

/** Token majburiy — yo'q yoki yaroqsiz bo'lsa 401. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const userId = readUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Avval tizimga kiring' });
    return;
  }
  req.userId = userId;
  next();
}

/** Token ixtiyoriy — bor bo'lsa userId o'rnatiladi (masalan, egasiga qoralamani ko'rsatish uchun). */
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  req.userId = readUserId(req);
  next();
}
