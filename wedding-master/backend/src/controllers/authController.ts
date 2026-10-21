import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User, publicUser } from '../models/User';
import { AuthedRequest, signToken } from '../middleware/auth';

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
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Email yoki parol noto'g'ri" });
      return;
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
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}
