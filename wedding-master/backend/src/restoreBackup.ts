import 'dotenv/config';
import fs from 'fs';
import { gunzipSync } from 'zlib';
import mongoose from 'mongoose';

/*
 * Telegram kanalidagi nusxadan tiklash (bo'sh bazaga):
 *   MONGODB_URI=... TG_BOT_TOKEN=... node backend/dist/restoreBackup.js beluga-db-....json.gz
 * Kanaldagi eng oxirgi .json.gz faylni yuklab oling. Skript hujjatlarni yozadi va
 * yuklangan fayllarni Telegram'dan qaytarib oladi. --force: mavjud bazani tozalab tiklaydi.
 */

const API_BASE = (process.env.TG_API_BASE ?? 'https://api.telegram.org').replace(/\/+$/, '');
const TOKEN = process.env.TG_BOT_TOKEN ?? '';
const UPLOAD_CHUNK_BYTES = 4 * 1024 * 1024;

async function downloadTelegramFile(fileId: string): Promise<Buffer> {
  const info = await fetch(`${API_BASE}/bot${TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`);
  const body = (await info.json()) as { ok: boolean; description?: string; result?: { file_path?: string } };
  if (!body.ok || !body.result?.file_path) throw new Error(body.description ?? 'getFile xato');
  const file = await fetch(`${API_BASE}/file/bot${TOKEN}/${body.result.file_path}`);
  if (!file.ok) throw new Error(`yuklab olish xato: ${file.status}`);
  return Buffer.from(await file.arrayBuffer());
}

async function main(): Promise<void> {
  const [path, flag] = process.argv.slice(2);
  const uri = process.env.MONGODB_URI;
  if (!path || !uri || !TOKEN) throw new Error('Kerak: fayl yo\'li, MONGODB_URI va TG_BOT_TOKEN');

  const dump = mongoose.mongo.BSON.EJSON.parse(gunzipSync(fs.readFileSync(path)).toString('utf8'), { relaxed: true }) as {
    version: number;
    createdAt: Date;
    collections: Record<string, Record<string, unknown>[]>;
  };
  if (dump.version !== 1) throw new Error(`Noma'lum nusxa versiyasi: ${dump.version}`);

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) throw new Error('Baza ulanmagan');

  const existing = (await db.listCollections().toArray()).map((c) => c.name);
  const filled = (await Promise.all(existing.map(async (n) => ((await db.collection(n).estimatedDocumentCount()) > 0 ? n : null)))).filter(Boolean);
  if (filled.length > 0 && flag !== '--force') {
    throw new Error(`Baza bo'sh emas (${filled.join(', ')}). Tozalab tiklash uchun --force qo'shing.`);
  }
  for (const name of existing) await db.collection(name).drop();

  for (const [name, docs] of Object.entries(dump.collections)) {
    if (docs.length) await db.collection(name).insertMany(docs);
    console.log(`${name}: ${docs.length}`);
  }

  const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
  const files = dump.collections.backupfiles ?? [];
  let failed = 0;
  for (const file of files) {
    const filename = file.filename as string;
    try {
      const data = await downloadTelegramFile(file.fileId as string);
      await new Promise<void>((resolve, reject) => {
        const stream = bucket.openUploadStream(filename, { chunkSizeBytes: UPLOAD_CHUNK_BYTES, metadata: { contentType: file.contentType } });
        stream.once('finish', () => resolve());
        stream.once('error', reject);
        stream.end(data);
      });
    } catch (err) {
      failed += 1;
      console.error(`${filename}: ${(err as Error).message}`);
    }
  }
  console.log(`fayllar: ${files.length - failed}/${files.length}`);
  console.log(`Nusxa sanasi: ${dump.createdAt.toISOString()}`);
  await mongoose.disconnect();
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exit(1);
});
