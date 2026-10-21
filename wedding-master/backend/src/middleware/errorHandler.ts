import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Fayl 12MB dan katta' : 'Faylni yuklab bo‘lmadi';
    res.status(413).json({ error: msg });
    return;
  }
  // Bir vaqtda ikki kishi bir xil slug olsa, unique indeks shu yerda ushlaydi
  if ((err as { code?: number }).code === 11000) {
    res.status(409).json({ error: 'Bu manzil band. Boshqasini tanlang.', field: 'slug' });
    return;
  }
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} —`, err);
  res.status(500).json({ error: 'Internal server error' });
}
