import { Invitation, IInvitation, TemplateKey } from '../models/Invitation';
import { TemplateSettings } from '../models/TemplateSettings';
import { Track } from '../models/Track';
import { invalidatePublic } from './publicCache';
import { deleteUploads } from '../storage';
import { invalidateTemplateSettings, templateMedia } from './templateSettings';

/**
 * Saytga o'rnatilgan musiqalar (frontend/public ichida). `templates` — bu musiqa
 * standart bo'lgan shablonlar (frontend templates/registry.ts bilan bir xil):
 * admin uni qirqsa, shu shablonlarda ham qirqilgani chalinadi.
 */
export const BUILT_IN_TRACKS: { key: string; url: string; title: string; artist: string; durationSec: number; templates: TemplateKey[] }[] = [
  { key: 'osmon', url: '/templates/osmon/music.mp3', title: 'Seni osmonimga olib ketaman', artist: '', durationSec: 27, templates: ['osmon'] },
  { key: 'wedding', url: '/leberch-invitation-wedding-375839.mp3', title: 'Wedding Invitation', artist: 'Leberch', durationSec: 110, templates: ['bog', 'atirgul', 'kuz'] },
  { key: 'anor', url: '/templates/anor/music.mp3', title: 'Anor kuyi', artist: '', durationSec: 142, templates: ['anor'] },
];

/** Server ishga tushganda: eski holatlarni yangisiga o'tkazadi, o'rnatilgan musiqalarni qo'shadi. */
export async function prepareMusicLibrary(): Promise<void> {
  await Track.collection.updateMany({ status: 'approved' }, { $set: { status: 'active' } });
  await Track.collection.updateMany({ status: { $in: ['pending', 'rejected'] } }, { $set: { status: 'inactive' } });
  for (const t of BUILT_IN_TRACKS) {
    await Track.updateOne(
      { builtInKey: t.key },
      {
        $setOnInsert: {
          builtInKey: t.key,
          url: t.url,
          sourceUrl: t.url,
          title: t.title,
          artist: t.artist,
          durationSec: t.durationSec,
          status: 'active',
          decidedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }
}

/** Foydalanuvchi yuklagan audio fayl (kutubxonaga nomzod). */
export function isUploadedAudio(url: string | undefined): url is string {
  return Boolean(url && url.startsWith('/uploads/') && /\.(mp3|m4a)$/i.test(url));
}

/**
 * Taklifnoma o'z musiqasi bilan saqlanganda uni kutubxonaga inactive holda
 * yozadi (bir fayl — bitta yozuv). Admin qarori o'zgarmaydi; faqat hali nomi
 * bo'lmaganiga foydalanuvchi bergan nom qo'yiladi.
 */
export async function rememberUploadedMusic(inv: Pick<IInvitation, '_id' | 'owner' | 'musicUrl' | 'musicTitle'>): Promise<void> {
  if (!isUploadedAudio(inv.musicUrl)) return;
  // Admin qirqib bo'lgan musiqaning asl fayli alohida yozuv bo'lmasin
  if (await Track.exists({ sourceUrl: inv.musicUrl })) return;
  const title = inv.musicTitle?.trim() ?? '';
  await Track.updateOne(
    { url: inv.musicUrl },
    { $setOnInsert: { url: inv.musicUrl, title, status: 'inactive', submittedBy: inv.owner, invitation: inv._id } },
    { upsert: true }
  );
  if (title) await Track.updateOne({ url: inv.musicUrl, status: 'inactive', title: '' }, { $set: { title } });
}

/** Bu funksiya qo'shilishidan oldin yuklangan musiqalarni ham kutubxonaga qo'shadi. */
export async function syncUploadedMusic(): Promise<void> {
  const tracks = await Track.find().select('url sourceUrl').lean();
  const known = new Set(tracks.flatMap((t) => [t.url, t.sourceUrl]));
  const invitations = await Invitation.find({ musicUrl: /^\/uploads\// }).select('owner musicUrl musicTitle');
  for (const inv of invitations) {
    if (!known.has(inv.musicUrl)) await rememberUploadedMusic(inv);
  }
}

/** Kutubxonadagi fayllar (qirqilgani ham, asli ham) — taklifnoma o'chsa ham saqlanadi. */
export async function libraryMedia(urls: string[]): Promise<Set<string>> {
  const audio = urls.filter(isUploadedAudio);
  if (audio.length === 0) return new Set();
  const tracks = await Track.find({ $or: [{ url: { $in: audio } }, { sourceUrl: { $in: audio } }] }).select('url sourceUrl').lean();
  return new Set(tracks.flatMap((t) => [t.url, t.sourceUrl]).filter((u): u is string => Boolean(u)));
}

/** Hech bir taklifnoma, shablon standarti yoki kutubxona yozuvi ishlatmasa, faylni o'chiradi. */
export async function deleteTrackFileIfUnused(url: string): Promise<boolean> {
  if (!url.startsWith('/uploads/')) return false;
  const used =
    (await Invitation.exists({ musicUrl: url })) ||
    (await Track.exists({ $or: [{ url }, { sourceUrl: url }] })) ||
    (await templateMedia()).has(url);
  if (used) return false;
  await deleteUploads([url]);
  return true;
}

/**
 * Musiqa qirqilgach, eski faylni ishlatayotgan hamma joy yangisiga o'tadi:
 * taklifnomalar, shablon standartlari va (o'rnatilgan musiqa bo'lsa) uning shablonlari.
 */
export async function replaceMusicUrl(oldUrl: string, newUrl: string, builtInKey?: string): Promise<void> {
  const invitations = await Invitation.find({ musicUrl: oldUrl }).select('slug').lean();
  if (invitations.length) {
    await Invitation.updateMany({ musicUrl: oldUrl }, { $set: { musicUrl: newUrl } });
    invalidatePublic(...invitations.map((i) => i.slug));
  }
  await TemplateSettings.updateMany({ music: oldUrl }, { $set: { music: newUrl } });
  const builtIn = BUILT_IN_TRACKS.find((t) => t.key === builtInKey);
  for (const key of builtIn?.templates ?? []) {
    const settings = await TemplateSettings.findOne({ key });
    if (newUrl === builtIn?.url) {
      // Asl holiga qaytdi — shablon yana o'z standartini ishlatadi
      if (settings?.music === newUrl) {
        settings.music = '';
        await settings.save();
      }
    } else if (!settings) {
      // Admin shablonga boshqa musiqa tanlamagan bo'lsa — standart ham almashadi
      await TemplateSettings.create({ key, music: newUrl });
    } else if (!settings.music) {
      settings.music = newUrl;
      await settings.save();
    }
  }
  invalidateTemplateSettings();
}
