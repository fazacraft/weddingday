import { Invitation, IInvitation } from '../models/Invitation';
import { Track } from '../models/Track';
import { deleteUploads } from '../storage';

/** Foydalanuvchi yuklagan audio fayl (kutubxonaga nomzod). */
export function isUploadedAudio(url: string | undefined): url is string {
  return Boolean(url && url.startsWith('/uploads/') && /\.(mp3|m4a)$/i.test(url));
}

/**
 * Taklifnoma o'z musiqasi bilan saqlanganda uni kutubxonaga nomzod qilib
 * yozadi (bir fayl — bitta yozuv). Admin qarori o'zgarmaydi; faqat hali nomi
 * bo'lmagan nomzodga foydalanuvchi bergan nom qo'yiladi.
 */
export async function rememberUploadedMusic(inv: Pick<IInvitation, '_id' | 'owner' | 'musicUrl' | 'musicTitle'>): Promise<void> {
  if (!isUploadedAudio(inv.musicUrl)) return;
  const title = inv.musicTitle?.trim() ?? '';
  await Track.updateOne(
    { url: inv.musicUrl },
    { $setOnInsert: { url: inv.musicUrl, title, status: 'pending', submittedBy: inv.owner, invitation: inv._id } },
    { upsert: true }
  );
  if (title) await Track.updateOne({ url: inv.musicUrl, status: 'pending', title: '' }, { $set: { title } });
}

/** Bu funksiya qo'shilishidan oldin yuklangan musiqalarni ham nomzodlar ro'yxatiga qo'shadi. */
export async function syncUploadedMusic(): Promise<void> {
  const known = new Set((await Track.find().select('url').lean()).map((t) => t.url));
  const invitations = await Invitation.find({ musicUrl: /^\/uploads\// }).select('owner musicUrl musicTitle');
  for (const inv of invitations) {
    if (!known.has(inv.musicUrl)) await rememberUploadedMusic(inv);
  }
}

/** Kutubxonada (kutayotgan yoki tasdiqlangan) turgan fayllar — taklifnoma o'chsa ham saqlanadi. */
export async function libraryMedia(urls: string[]): Promise<Set<string>> {
  const audio = urls.filter(isUploadedAudio);
  if (audio.length === 0) return new Set();
  const tracks = await Track.find({ url: { $in: audio }, status: { $in: ['pending', 'approved'] } }).select('url').lean();
  return new Set(tracks.map((t) => t.url));
}

/** Kutubxonadan chiqarilgan faylni hech bir taklifnoma ishlatmasa, uni ham o'chiradi. */
export async function deleteTrackFileIfUnused(url: string): Promise<boolean> {
  if (await Invitation.exists({ musicUrl: url })) return false;
  await deleteUploads([url]);
  return true;
}
