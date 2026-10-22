import crypto from 'crypto';
import { Request, Response } from 'express';
import { signAdminToken } from '../middleware/auth';

/**
 * /admin paneliga alohida login/parol (ADMIN_USERNAME, ADMIN_PASSWORD env).
 * Repo ochiq — qiymatlar faqat server sozlamasida saqlanadi.
 */
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;
const fails = new Map<string, { count: number; until: number }>();

function safeEqual(a: string, b: string): boolean {
  // Uzunlik farqi ham vaqt orqali sezilmasligi uchun hash'larni solishtiramiz
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function adminLogin(req: Request, res: Response): void {
  const expectedUser = process.env.ADMIN_USERNAME ?? '';
  const expectedPass = process.env.ADMIN_PASSWORD ?? '';
  if (!expectedUser || !expectedPass) {
    res.status(503).json({ error: 'Admin login sozlanmagan' });
    return;
  }

  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const entry = fails.get(ip);
  if (entry && entry.until > now) {
    const min = Math.ceil((entry.until - now) / 60_000);
    res.status(429).json({ error: `Juda ko'p urinish. ${min} daqiqadan keyin qayta urinib ko'ring.` });
    return;
  }

  const { username = '', password = '' } = (req.body ?? {}) as { username?: string; password?: string };
  const ok = safeEqual(String(username).trim(), expectedUser) && safeEqual(String(password), expectedPass);
  if (!ok) {
    // Blok muddati tugagan bo'lsa hisob noldan boshlanadi
    const lockExpired = entry !== undefined && entry.until > 0 && entry.until <= now;
    const count = (lockExpired ? 0 : entry?.count ?? 0) + 1;
    fails.set(ip, { count, until: count >= MAX_FAILS ? now + LOCK_MS : 0 });
    res.status(401).json({ error: "Login yoki parol noto'g'ri" });
    return;
  }

  fails.delete(ip);
  res.json({ token: signAdminToken() });
}
