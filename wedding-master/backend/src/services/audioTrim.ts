import { execFile } from 'child_process';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { localUploadPath, saveUpload } from '../storage';

const run = promisify(execFile);
const TIMEOUT_MS = 60_000;
const CONTENT_TYPES: Record<string, string> = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4' };

/** Saytga o'rnatilgan fayllar: production'da build, lokalda public papkasi. */
const SITE_ROOTS = ['../../../frontend/dist', '../../../frontend/public'].map((p) => path.resolve(__dirname, p));

export class TrimError extends Error {}

async function localPath(url: string): Promise<string> {
  if (url.startsWith('/uploads/')) {
    const file = await localUploadPath(url.slice('/uploads/'.length));
    if (!file) throw new TrimError('Musiqa fayli topilmadi');
    return file;
  }
  for (const root of SITE_ROOTS) {
    const file = path.join(root, url);
    if (!file.startsWith(root + path.sep)) break;
    const found = await fsp.stat(file).then((s) => s.isFile()).catch(() => false);
    if (found) return file;
  }
  throw new TrimError('Musiqa fayli topilmadi');
}

function toolMissing(err: unknown): boolean {
  return (err as NodeJS.ErrnoException).code === 'ENOENT';
}

async function probeFile(file: string): Promise<number> {
  try {
    const { stdout } = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { timeout: TIMEOUT_MS });
    const duration = Number.parseFloat(stdout);
    if (!Number.isFinite(duration) || duration <= 0) throw new TrimError("Musiqa faylini o'qib bo'lmadi");
    return duration;
  } catch (err) {
    if (err instanceof TrimError) throw err;
    throw new TrimError(toolMissing(err) ? "Serverda ffmpeg o'rnatilmagan" : "Musiqa faylini o'qib bo'lmadi");
  }
}

export async function audioDuration(url: string): Promise<number> {
  return probeFile(await localPath(url));
}

/**
 * Asl fayldan [start, end] oralig'ini (soniya) yangi faylga qirqadi. Audio qayta
 * kodlanmaydi — sifat yo'qolmaydi, 1 GB xotirali serverda ham bir lahzada bo'ladi.
 */
export async function trimAudio(sourceUrl: string, start: number, end: number): Promise<{ url: string; durationSec: number }> {
  const source = await localPath(sourceUrl);
  const ext = path.extname(source).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) throw new TrimError('Faqat MP3 va M4A qirqiladi');
  const total = await probeFile(source);
  if (start >= total) throw new TrimError('A musiqa uzunligidan katta');

  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'beluga-trim-'));
  try {
    const out = path.join(dir, `out${ext}`);
    const length = Math.min(end, total) - start;
    await run(
      'ffmpeg',
      ['-hide_banner', '-loglevel', 'error', '-y', '-ss', start.toFixed(3), '-t', length.toFixed(3), '-i', source, '-vn', '-map_metadata', '-1', '-c:a', 'copy', ...(ext === '.m4a' ? ['-movflags', '+faststart'] : []), out],
      { timeout: TIMEOUT_MS }
    ).catch((err) => {
      throw new TrimError(toolMissing(err) ? "Serverda ffmpeg o'rnatilmagan" : "Musiqani qirqib bo'lmadi");
    });
    const durationSec = await probeFile(out);
    return { url: await saveUpload(await fsp.readFile(out), contentType), durationSec: Math.round(durationSec) };
  } finally {
    await fsp.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
