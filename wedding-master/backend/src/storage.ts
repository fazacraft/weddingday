import crypto from 'crypto';
import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';

/**
 * Yuklangan rasm va musiqalar MongoDB GridFS'da saqlanadi: Render kabi
 * hostinglarda disk har deploy'da tozalanadi, baza esa saqlanib qoladi.
 */
const BUCKET = 'uploads';

export const ALLOWED_TYPES = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['audio/mpeg', '.mp3'],
  ['audio/mp3', '.mp3'],
  ['audio/mp4', '.m4a'],
  ['audio/x-m4a', '.m4a'],
]);

function bucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB is not connected');
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET });
}

/** Faylni saqlaydi va uning ochiq yo'lini qaytaradi (/uploads/<uuid>.<ext>). */
export async function saveUpload(buffer: Buffer, contentType: string, name?: string): Promise<string> {
  const filename = name ?? `${crypto.randomUUID()}${ALLOWED_TYPES.get(contentType) ?? ''}`;
  await new Promise<void>((resolve, reject) => {
    const stream = bucket().openUploadStream(filename, { metadata: { contentType } });
    stream.once('finish', () => resolve());
    stream.once('error', reject);
    stream.end(buffer);
  });
  return `/uploads/${filename}`;
}

/** /uploads/<nom> yo'llari bo'yicha fayllarni o'chiradi (boshqa manzillar e'tiborsiz qoldiriladi). */
export async function deleteUploads(urls: string[]): Promise<void> {
  const names = urls
    .filter((u) => u.startsWith('/uploads/'))
    .map((u) => u.slice('/uploads/'.length));
  if (names.length === 0) return;
  const b = bucket();
  const files = await b.find({ filename: { $in: names } }).toArray();
  await Promise.all(files.map((f) => b.delete(f._id)));
}

export async function uploadExists(filename: string): Promise<boolean> {
  return (await bucket().find({ filename }).limit(1).toArray()).length > 0;
}

/**
 * GET /uploads/:name — fayl nomlari tasodifiy UUID va o'zgarmaydi, shuning
 * uchun uzoq keshlanadi. Range so'rovlari qo'llanadi: Safari audio'ni faqat
 * 206 javoblari bilan chaladi.
 */
export async function serveUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [file] = await bucket().find({ filename: req.params.name }).limit(1).toArray();
    if (!file) {
      res.status(404).end();
      return;
    }
    const size = file.length;
    const contentType = (file.metadata?.contentType as string | undefined) ?? 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');

    let start = 0;
    let end = size - 1;
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
    if (range && (range[1] || range[2])) {
      if (range[1]) {
        start = Number(range[1]);
        if (range[2]) end = Math.min(Number(range[2]), size - 1);
      } else {
        // "bytes=-500" — oxirgi 500 bayt
        start = Math.max(0, size - Number(range[2]));
      }
      if (start > end || start >= size) {
        res.status(416).setHeader('Content-Range', `bytes */${size}`).end();
        return;
      }
      res.status(206).setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    }
    res.setHeader('Content-Length', String(end - start + 1));
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    bucket()
      .openDownloadStream(file._id, { start, end: end + 1 })
      .on('error', next)
      .pipe(res);
  } catch (err) {
    next(err);
  }
}
