import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, isAdminEmail } from '../models/User';

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

function readPayload(req: Request): jwt.JwtPayload | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return undefined;
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    return typeof payload === 'object' ? payload : undefined;
  } catch {
    return undefined;
  }
}

/** Oddiy foydalanuvchi tokeni (admin panel tokeni bu yerda qabul qilinmaydi). */
function readUserId(req: Request): string | undefined {
  const payload = readPayload(req);
  return payload && !payload.adm && typeof payload.sub === 'string' ? payload.sub : undefined;
}

const ADMIN_TOKEN_TTL = '12h';

/** /admin paneliga login/parol bilan kirganda beriladigan token (foydalanuvchiga bog'lanmagan). */
export function signAdminToken(): string {
  return jwt.sign({ sub: 'panel-admin', adm: true }, JWT_SECRET, { expiresIn: ADMIN_TOKEN_TTL });
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

/** Faqat ADMIN_EMAILS ro'yxatidagi foydalanuvchilar (har so'rovda bazadan tekshiriladi). */
export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  // Admin panel login/paroli bilan olingan token
  if (readPayload(req)?.adm === true) {
    next();
    return;
  }
  const userId = readUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'Avval tizimga kiring' });
    return;
  }
  try {
    const user = await User.findById(userId).select('email');
    if (!user || !isAdminEmail(user.email)) {
      res.status(403).json({ error: "Bu bo'lim faqat adminlar uchun" });
      return;
    }
    req.userId = userId;
    next();
  } catch (err) {
    next(err);
  }
}
