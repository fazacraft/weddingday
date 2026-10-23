import crypto from 'crypto';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import type SharpType from 'sharp';
import { Request, Response, NextFunction } from 'express';

/**
 * Yuklangan rasm va musiqalar MongoDB GridFS'da saqlanadi: Render kabi
 * hostinglarda disk har deploy'da tozalanadi, baza esa saqlanib qoladi.
 *
 * Baza serverdan uzoqda bo'lishi mumkin (Atlas boshqa hududda) — har bir
 * rasmni GridFS'dan bo'laklab olish sekin. Shuning uchun fayllar serverning
 * diskida ham keshlanadi (UPLOAD_CACHE_DIR). Nomlar tasodifiy UUID va fayl
 * hech qachon o'zgarmaydi, shuning uchun keshni yangilash muammosi yo'q;
 * kesh yo'qolsa ham (yangi server) birinchi so'rovda qayta to'ladi.
 */
const BUCKET = 'uploads';
const CACHE_DIR = process.env.UPLOAD_CACHE_DIR || path.join(os.tmpdir(), 'beluga-uploads');
const CACHE_MAX_AGE = '30d';

/**
 * Rasm uchun so'rash mumkin bo'lgan kengliklar (?w=) — frontend'dagi PHOTO_WIDTHS
 * bilan bir xil. Ixtiyoriy son o'rniga eng yaqin kattasi olinadi, kesh cheklanadi.
 */
export const VARIANT_WIDTHS = [640, 1000, 1600];

export const ALLOWED_TYPES = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['audio/mpeg', '.mp3'],
  ['audio/mp3', '.mp3'],
  ['audio/mp4', '.m4a'],
  ['audio/x-m4a', '.m4a'],
]);

const TYPE_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
};
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

/**
 * sharp — native kutubxona. Modul yuklanishida import qilinmaydi: biror sababdan
 * ishlamasa (platforma, xotira), server baribir ishga tushadi va asl rasmni beradi.
 */
let sharpLoader: Promise<typeof SharpType | null> | null = null;
function loadSharp(): Promise<typeof SharpType | null> {
  sharpLoader ??= import('sharp')
    .then(({ default: sharp }) => {
      // 1 GB xotirali serverda bir vaqtda faqat bitta rasm qayta ishlanadi
      sharp.cache(false);
      sharp.concurrency(1);
      return sharp;
    })
    .catch((err: Error) => {
      console.warn('sharp ishlamayapti — rasmlar asl o\'lchamda beriladi:', err.message);
      return null;
    });
  return sharpLoader;
}

try {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
} catch (err) {
  console.warn(`Upload cache disabled (${CACHE_DIR}):`, (err as Error).message);
}

function bucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB is not connected');
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET });
}

/** URL'dagi nomni tekshiradi — diskdagi yo'lga aylanadi, shuning uchun "../" va shu kabilar yo'q. */
function safeName(name: unknown): string | null {
  return typeof name === 'string' && /^[A-Za-z0-9][\w.-]*$/.test(name) && !name.includes('..') ? name : null;
}

const originalPath = (name: string) => path.join(CACHE_DIR, name);
const variantPath = (name: string, width: number) => path.join(CACHE_DIR, `${name}@w${width}.webp`);

async function exists(file: string): Promise<boolean> {
  try {
    await fsp.access(file);
    return true;
  } catch {
    return false;
  }
}

/** Yarim yozilgan fayl hech qachon berilmasligi uchun avval vaqtinchalik nomga yozamiz. */
async function writeAtomic(target: string, data: Buffer): Promise<void> {
  const tmp = `${target}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fsp.writeFile(tmp, data);
  await fsp.rename(tmp, target);
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

/** Bir xil faylni bir vaqtda kelgan so'rovlar uchun bir marta tayyorlaydi. */
const pending = new Map<string, Promise<string | null>>();
function once(key: string, task: () => Promise<string | null>): Promise<string | null> {
  const running = pending.get(key);
  if (running) return running;
  const promise = task().finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}

/** Original fayl diskda bo'lmasa, GridFS'dan yuklab keshlaydi. null — bunday fayl yo'q. */
async function ensureOriginal(name: string): Promise<string | null> {
  const target = originalPath(name);
  if (await exists(target)) return target;
  return once(target, async () => {
    const [file] = await bucket().find({ filename: name }).limit(1).toArray();
    if (!file) return null;
    await writeAtomic(target, await streamToBuffer(bucket().openDownloadStream(file._id)));
    return target;
  });
}

/**
 * Rasmning kichraytirilgan WebP varianti (EXIF bo'yicha to'g'rilangan, metama'lumotsiz).
 * sharp ishlamasa — asl fayl (keshlanmaydi, keyingi safar yana urinib ko'riladi).
 */
async function ensureVariant(name: string, width: number): Promise<{ file: string; webp: boolean } | null> {
  const target = variantPath(name, width);
  if (await exists(target)) return { file: target, webp: true };
  const sharp = await loadSharp();
  if (!sharp) {
    const original = await ensureOriginal(name);
    return original ? { file: original, webp: false } : null;
  }
  const file = await once(target, async () => {
    const original = await ensureOriginal(name);
    if (!original) return null;
    const output = await sharp(original, { failOn: 'none' })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer();
    await writeAtomic(target, output);
    return target;
  });
  return file ? { file, webp: true } : null;
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
  // Yuklagan odam darhol ko'radi — diskka ham yozib qo'yamiz (xato bo'lsa, keyin GridFS'dan olinadi).
  // Rasm bo'lsa, birinchi mehmon kutmasligi uchun o'lcham variantlari ham fonda tayyorlanadi.
  writeAtomic(originalPath(filename), buffer)
    .then(() => (IMAGE_EXT.test(filename) ? warmVariants(filename) : undefined))
    .catch(() => {});
  return `/uploads/${filename}`;
}

/** Barcha o'lcham variantlarini ketma-ket tayyorlaydi (sharp bir vaqtda bittadan ishlaydi). */
export async function warmVariants(name: string): Promise<void> {
  for (const width of VARIANT_WIDTHS) await ensureVariant(name, width);
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
  const cached = names
    .map(safeName)
    .filter((n): n is string => Boolean(n))
    .flatMap((n) => [originalPath(n), ...VARIANT_WIDTHS.map((w) => variantPath(n, w))]);
  await Promise.all(cached.map((file) => fsp.rm(file, { force: true }).catch(() => {})));
}

export async function uploadExists(filename: string): Promise<boolean> {
  return (await bucket().find({ filename }).limit(1).toArray()).length > 0;
}

/** Diskdagi faylni beradi: Range (audio), ETag/304 va kesh sarlavhalari express'ning o'zida. */
function sendCached(res: Response, next: NextFunction, file: string, contentType: string): void {
  res.setHeader('Content-Type', contentType);
  res.sendFile(file, { maxAge: CACHE_MAX_AGE, immutable: true }, (err?: NodeJS.ErrnoException) => {
    if (!err || res.headersSent) return;
    if (err.code === 'ENOENT') res.status(404).end();
    else next(err);
  });
}

/**
 * GET /uploads/:name[?w=640] — fayl nomlari tasodifiy UUID va o'zgarmaydi,
 * shuning uchun uzoq keshlanadi. ?w= berilsa, rasmning shu kenglikdagi WebP
 * varianti qaytadi. Range so'rovlari qo'llanadi: Safari audio'ni faqat 206
 * javoblari bilan chaladi.
 */
export async function serveUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const name = safeName(req.params.name);
    if (!name) {
      res.status(404).end();
      return;
    }

    const requested = Number(req.query.w);
    if (requested > 0 && IMAGE_EXT.test(name)) {
      const width = VARIANT_WIDTHS.find((w) => w >= requested) ?? VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1];
      const variant = await ensureVariant(name, width);
      if (!variant) {
        res.status(404).end();
        return;
      }
      const type = variant.webp ? 'image/webp' : TYPE_BY_EXT[path.extname(name).toLowerCase()] ?? 'application/octet-stream';
      sendCached(res, next, variant.file, type);
      return;
    }

    const contentTypeByExt = TYPE_BY_EXT[path.extname(name).toLowerCase()];
    const cached = originalPath(name);
    if (contentTypeByExt && (await exists(cached))) {
      sendCached(res, next, cached, contentTypeByExt);
      return;
    }

    // Diskda hali yo'q: birinchi so'rovchi kutmasligi uchun GridFS'dan oqim bilan
    // beramiz, parallel ravishda esa keyingilar uchun diskka yozib qo'yamiz
    const [file] = await bucket().find({ filename: name }).limit(1).toArray();
    if (!file) {
      res.status(404).end();
      return;
    }
    ensureOriginal(name).catch(() => {});

    const size = file.length;
    const contentType = (file.metadata?.contentType as string | undefined) ?? contentTypeByExt ?? 'application/octet-stream';
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
