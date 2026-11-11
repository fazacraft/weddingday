import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User, publicUser } from '../models/User';
import { AuthedRequest, isImpersonated, signToken } from '../middleware/auth';
import { googleClientId, verifyGoogleCredential } from '../services/googleAuth';

/** Saqlangan sessiya bilan qaytganda "oxirgi kirgan" vaqti shundan siyrakroq yoziladi */
const LAST_SEEN_EVERY_MS = 10 * 60_000;

/** Bir xil javob — hisob bor-yo'qligi va qanday ochilgani bilinmasin */
const WRONG_LOGIN = "Email yoki parol noto'g'ri. Hisobingiz Google orqali ochilgan bo'lsa, «Google bilan kirish»ni bosing.";

export async function register(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    const exists = await User.exists({ email: email.toLowerCase() });
    if (exists) {
      res.status(409).json({ error: "Bu email bilan allaqachon ro'yxatdan o'tilgan" });
      return;
    }
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      lastLoginAt: new Date(),
    });
    res.status(201).json({ token: signToken(String(user._id)), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: WRONG_LOGIN });
      return;
    }
    user.lastLoginAt = new Date();
    await user.save();
    res.json({ token: signToken(String(user._id)), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/config — kirish sahifasi uchun: Google tugmasi yoqilganmi. */
export function authConfig(_req: AuthedRequest, res: Response): void {
  res.json({ googleClientId: googleClientId() || null });
}

/**
 * POST /api/auth/google { credential } — Google ID token bilan kirish. Hisob bo'lmasa
 * ochiladi; shu email bilan parolli hisob bo'lsa, unga bog'lanadi (email'ni Google
 * tasdiqlagan), parol ham ishlayveradi.
 */
export async function googleLogin(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!googleClientId()) {
      res.status(503).json({ error: 'Google orqali kirish sozlanmagan' });
      return;
    }
    const credential = (req.body as { credential?: unknown }).credential;
    const profile = typeof credential === 'string' ? await verifyGoogleCredential(credential) : null;
    if (!profile) {
      res.status(401).json({ error: "Google orqali kirib bo'lmadi. Qaytadan urinib ko'ring." });
      return;
    }
    let user = (await User.findOne({ googleId: profile.sub })) ?? (await User.findOne({ email: profile.email }));
    if (!user) {
      user = await User.create({ name: profile.name, email: profile.email, googleId: profile.sub, lastLoginAt: new Date() });
    } else {
      user.googleId ??= profile.sub;
      user.lastLoginAt = new Date();
      await user.save();
    }
    res.json({ token: signToken(String(user._id)), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(401).json({ error: 'Foydalanuvchi topilmadi' });
      return;
    }
    const impersonated = isImpersonated(req);
    // Saqlangan sessiya bilan qaytish ham "kirish" — admin uning nomidan kirgani hisoblanmaydi
    if (!impersonated && Date.now() - (user.lastLoginAt?.getTime() ?? 0) > LAST_SEEN_EVERY_MS) {
      User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } }).catch(() => {});
    }
    res.json({ user: { ...publicUser(user), ...(impersonated ? { impersonated: true } : {}) } });
  } catch (err) {
    next(err);
  }
}
