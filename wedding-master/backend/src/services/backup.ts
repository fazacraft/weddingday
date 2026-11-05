import fsp from 'fs/promises';
import { promisify } from 'util';
import { gzip } from 'zlib';
import mongoose from 'mongoose';
import { BackupFile, BackupState } from '../models/Backup';
import { localUploadPath } from '../storage';
import { ADMIN_CHAT_ID, botIsChannelAdmin, escapeHtml, getChannelInfo, sendDocument, sendToChat, telegramEnabled } from './telegram';

/*
 * Ma'lumotlarning yopiq Telegram kanaliga nusxasi. Har kuni:
 *  - yangi yuklangan fayllar (rasm, musiqa) — har biri bir marta, alohida xabar;
 *  - butun baza — bitta .json.gz (fayllar ro'yxati va ularning Telegram id'lari bilan).
 * Tiklash: backend/src/restoreBackup.ts. .env sirlari ataylab kirmaydi.
 */

/** Toshkent vaqti bilan 03:00 */
const RUN_HOUR_UTC = 22;
/** Server shuncha vaqt nusxa olmagan bo'lsa, ishga tushishi bilan oladi (deploy kechasiga to'g'ri kelsa) */
const CATCH_UP_AFTER_MS = 25 * 60 * 60 * 1000;
const CATCH_UP_DELAY_MS = 60_000;
/** Bot kanalga daqiqasiga 20 tadan ortiq xabar yubora olmaydi */
const SEND_GAP_MS = 3_500;
/** Telegram botlari uchun chegara 50 MB */
const MAX_DOCUMENT_BYTES = 49 * 1024 * 1024;
// Cheklar nusxaga kirmaydi: har biri kelganda admin'ning Telegram chatiga yuboriladi
const FILES_COLLECTIONS = new Set(['uploads.files', 'uploads.chunks', 'receipts.files', 'receipts.chunks']);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const gzipAsync = promisify(gzip);

export interface BackupResult {
  counts: Record<string, number>;
  files: number;
  newFiles: number;
  failedFiles: number;
  dumpBytes: number;
}

function db() {
  const database = mongoose.connection.db;
  if (!database) throw new Error('Baza ulanmagan');
  return database;
}

/** Hali kanalga yuborilmagan yuklangan fayllarni yuboradi. */
async function sendNewFiles(channelId: number): Promise<{ total: number; sent: number; failed: number }> {
  const files = await db().collection('uploads.files').find({}).project({ filename: 1, length: 1, metadata: 1 }).toArray();
  const known = new Set((await BackupFile.find().select('filename').lean()).map((f) => f.filename));
  const pending = files.filter((f) => !known.has(f.filename));
  let sent = 0;
  let failed = 0;
  for (const file of pending) {
    try {
      const path = await localUploadPath(file.filename);
      if (!path) throw new Error('fayl topilmadi');
      const contentType = (file.metadata?.contentType as string | undefined) ?? 'application/octet-stream';
      const result = await sendDocument(channelId, await fsp.readFile(path), file.filename, contentType, `📎 ${file.filename}`);
      await BackupFile.create({ filename: file.filename, contentType, size: file.length, fileId: result.fileId, messageId: result.messageId });
      sent += 1;
    } catch (err) {
      // Keyingi nusxada yana urinib ko'riladi
      console.error(`Backup: ${file.filename} yuborilmadi:`, (err as Error).message);
      failed += 1;
    }
    await sleep(SEND_GAP_MS);
  }
  return { total: files.length, sent, failed };
}

/** Bazaning barcha kolleksiyalari (fayl bo'laklaridan tashqari) — ObjectId va sanalar EJSON'da saqlanadi. */
async function dumpDatabase(): Promise<{ data: Buffer; counts: Record<string, number> }> {
  const names = (await db().listCollections().toArray()).map((c) => c.name).filter((n) => !FILES_COLLECTIONS.has(n));
  const collections: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  for (const name of names.sort()) {
    collections[name] = await db().collection(name).find({}).toArray();
    counts[name] = collections[name].length;
  }
  const text = mongoose.mongo.BSON.EJSON.stringify({ version: 1, createdAt: new Date(), collections }, { relaxed: false });
  return { data: await gzipAsync(text), counts };
}

let running: Promise<BackupResult | null> | null = null;

/** Bitta to'liq nusxa. Kanal ulanmagan bo'lsa — null. Bir vaqtda faqat bittasi ishlaydi. */
export function runBackup(): Promise<BackupResult | null> {
  running ??= doBackup().finally(() => {
    running = null;
  });
  return running;
}

async function doBackup(): Promise<BackupResult | null> {
  const state = await BackupState.findById('main');
  if (!state?.channelId || !telegramEnabled()) return null;
  await BackupState.updateOne({ _id: 'main' }, { $set: { lastRunAt: new Date() } });
  try {
    const files = await sendNewFiles(state.channelId);
    const { data, counts } = await dumpDatabase();
    if (data.length > MAX_DOCUMENT_BYTES) {
      throw new Error(`baza nusxasi ${Math.round(data.length / 1e6)} MB — Telegram chegarasidan katta`);
    }
    const stamp = new Date(Date.now() + 5 * 3_600_000).toISOString().slice(0, 16).replace('T', ' ');
    const caption = [
      `🗄 Beluga backup — ${stamp} (Toshkent)`,
      `${counts.users ?? 0} foydalanuvchi · ${counts.invitations ?? 0} taklifnoma · ${counts.wishes ?? 0} tilak · ${counts.rsvps ?? 0} javob`,
      `${files.total} fayl (${files.sent} tasi yangi)`,
    ].join('\n');
    await sendDocument(state.channelId, data, `beluga-db-${stamp.replace(/[ :]/g, '-')}.json.gz`, 'application/gzip', caption);
    await BackupState.updateOne({ _id: 'main' }, { $set: { lastOkAt: new Date() }, $unset: { lastError: 1 } });
    if (files.failed > 0) {
      await sendToChat(ADMIN_CHAT_ID, `⚠️ Backup: ${files.failed} ta fayl yuborilmadi, keyingi safar yana urinib ko'riladi.`);
    }
    return { counts, files: files.total, newFiles: files.sent, failedFiles: files.failed, dumpBytes: data.length };
  } catch (err) {
    const message = (err as Error).message;
    await BackupState.updateOne({ _id: 'main' }, { $set: { lastError: message } });
    await sendToChat(ADMIN_CHAT_ID, `❌ <b>Backup ishlamadi:</b> ${escapeHtml(message)}`);
    throw err;
  }
}

export type ConnectResult = 'connected' | 'already' | 'public' | 'not-admin' | 'other-channel-connected';

/**
 * Admin kanaldan post forward qilganda ulaydi. Faqat yopiq kanal va bot admin
 * bo'lsa: nusxada parol xeshlari va shaxsiy ma'lumotlar bor. Ulangan kanalni tasodifiy
 * forward almashtirib yubormasin — boshqa kanalga o'tish faqat bazadan.
 */
export async function connectBackupChannel(channelId: number): Promise<ConnectResult> {
  const state = await BackupState.findById('main');
  if (state?.channelId === channelId) return 'already';
  if (state?.channelId) return 'other-channel-connected';
  const info = await getChannelInfo(channelId);
  if (!info) return 'not-admin';
  if (info.username) return 'public';
  if (!(await botIsChannelAdmin(channelId))) return 'not-admin';
  await BackupState.updateOne({ _id: 'main' }, { $set: { channelId, channelTitle: info.title } }, { upsert: true });
  return 'connected';
}

export function backupSummary(result: BackupResult): string {
  const size = (result.dumpBytes / 1024).toFixed(0);
  return `✅ Backup tayyor: baza ${size} KB, ${result.files} fayl (${result.newFiles} tasi yangi)${result.failedFiles ? `, ${result.failedFiles} tasi yuborilmadi` : ''}.`;
}

function msUntilNextRun(now = new Date()): number {
  const next = new Date(now);
  next.setUTCHours(RUN_HOUR_UTC, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}

/** Har kuni 03:00 da (Toshkent) nusxa oladi; xato bo'lsa admin'ga Telegram xabari boradi. */
export function startBackupSchedule(): void {
  const safeRun = () => runBackup().catch((err) => console.error('Backup failed:', (err as Error).message));
  const scheduleNext = () => {
    setTimeout(() => void safeRun().finally(scheduleNext), msUntilNextRun()).unref();
  };
  scheduleNext();
  setTimeout(() => {
    void BackupState.findById('main')
      .lean()
      .then((state) => {
        if (state?.channelId && Date.now() - (state.lastOkAt?.getTime() ?? 0) > CATCH_UP_AFTER_MS) return safeRun();
        return undefined;
      })
      .catch((err) => console.error('Backup check failed:', (err as Error).message));
  }, CATCH_UP_DELAY_MS).unref();
}
