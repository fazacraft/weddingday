import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { Invitation } from '../models/Invitation';
import { Track, TRACK_STATUSES, TrackStatus } from '../models/Track';
import { User } from '../models/User';
import { AuthedRequest } from '../middleware/auth';
import { BUILT_IN_TRACKS, deleteTrackFileIfUnused, isUploadedAudio, replaceMusicUrl, syncUploadedMusic } from '../services/musicLibrary';
import { audioDuration, TrimError, trimAudio } from '../services/audioTrim';
import { templateMedia } from '../services/templateSettings';

const MIN_TRIM_SEC = 1;

/** GET /api/music — wizard'dagi ro'yxat: active musiqalar, saytga o'rnatilganlari birinchi. */
export async function listActiveMusic(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tracks = await Track.find({ status: 'active' }).sort({ decidedAt: -1 }).lean();
    const rank = (key?: string) => {
      const i = BUILT_IN_TRACKS.findIndex((t) => t.key === key);
      return i === -1 ? BUILT_IN_TRACKS.length : i;
    };
    tracks.sort((x, y) => rank(x.builtInKey) - rank(y.builtInKey));
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(
      tracks.map((t) => ({
        id: String(t._id),
        url: t.url,
        title: t.title,
        artist: t.artist,
        durationSec: t.durationSec,
        builtIn: Boolean(t.builtInKey),
      }))
    );
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/music?status=active|inactive — butun kutubxona. */
export async function adminListMusic(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await syncUploadedMusic();
    const status = String(req.query.status ?? '');
    const filter = TRACK_STATUSES.includes(status as TrackStatus) ? { status } : {};
    const tracks = await Track.find(filter).sort({ createdAt: -1 }).lean();
    const [owners, usage] = await Promise.all([
      User.find({ _id: { $in: tracks.map((t) => t.submittedBy).filter(Boolean) } }).select('name email').lean(),
      Invitation.aggregate([
        { $match: { musicUrl: { $in: tracks.map((t) => t.url) } } },
        { $group: { _id: '$musicUrl', n: { $sum: 1 } } },
      ]),
    ]);
    const ownerById = new Map(owners.map((u) => [String(u._id), u]));
    const usageByUrl = new Map(usage.map((u) => [u._id as string, u.n as number]));
    res.json(
      tracks.map((t) => {
        const owner = t.submittedBy ? ownerById.get(String(t.submittedBy)) : undefined;
        return {
          id: String(t._id),
          url: t.url,
          title: t.title,
          artist: t.artist,
          durationSec: t.durationSec,
          status: t.status,
          sourceUrl: t.sourceUrl ?? t.url,
          trimStart: t.trimStart ?? null,
          trimEnd: t.trimEnd ?? null,
          builtIn: Boolean(t.builtInKey),
          createdAt: t.createdAt,
          usedBy: usageByUrl.get(t.url) ?? 0,
          submittedBy: owner ? { name: owner.name, email: owner.email } : null,
        };
      })
    );
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/music { url, title, artist, durationSec } — admin o'zi yuklagan musiqa darhol ro'yxatga tushadi. */
export async function adminCreateTrack(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { url, title, artist, durationSec } = req.body as Record<string, unknown>;
    if (typeof url !== 'string' || !isUploadedAudio(url) || url.includes('..')) {
      res.status(422).json({ error: "Musiqa fayli noto'g'ri" });
      return;
    }
    const name = typeof title === 'string' ? title.trim().slice(0, 120) : '';
    if (!name) {
      res.status(422).json({ error: "Qo'shiq nomini yozing", field: 'title' });
      return;
    }
    if (await Track.exists({ url })) {
      res.status(409).json({ error: "Bu musiqa ro'yxatda bor" });
      return;
    }
    const track = await Track.create({
      url,
      title: name,
      artist: typeof artist === 'string' ? artist.trim().slice(0, 120) : '',
      durationSec: typeof durationSec === 'number' && Number.isFinite(durationSec) && durationSec >= 0 ? Math.round(durationSec) : 0,
      status: 'active',
      decidedAt: new Date(),
    });
    res.status(201).json({ id: String(track._id), status: track.status, title: track.title });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/admin/music/:id — nom/ijrochini tuzatish va holat (active, inactive). */
export async function adminUpdateTrack(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const track = isValidObjectId(req.params.id) ? await Track.findById(req.params.id) : null;
    if (!track) {
      res.status(404).json({ error: 'Musiqa topilmadi' });
      return;
    }
    const { title, artist, durationSec, status } = req.body as Record<string, unknown>;
    if (typeof title === 'string') track.title = title.trim().slice(0, 120);
    if (typeof artist === 'string') track.artist = artist.trim().slice(0, 120);
    if (typeof durationSec === 'number' && Number.isFinite(durationSec) && durationSec >= 0) {
      track.durationSec = Math.round(durationSec);
    }
    if (status !== undefined) {
      if (!TRACK_STATUSES.includes(status as TrackStatus)) {
        res.status(422).json({ error: "Holat noto'g'ri" });
        return;
      }
      if (status === 'active' && !track.title) {
        res.status(422).json({ error: "Active qilishdan oldin qo'shiq nomini yozing", field: 'title' });
        return;
      }
      track.status = status as TrackStatus;
      track.decidedAt = new Date();
    }
    await track.save();
    res.json({ id: String(track._id), status: track.status, title: track.title, artist: track.artist, durationSec: track.durationSec });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/music/:id/trim { start, end } | { reset: true } — asl fayldan
 * [A:B] oralig'ini qirqadi (reset — asl holiga qaytaradi). Musiqani ishlatayotgan
 * taklifnomalar va shablonlar ham yangi faylga o'tadi.
 */
export async function adminTrimTrack(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const track = isValidObjectId(req.params.id) ? await Track.findById(req.params.id) : null;
    if (!track) {
      res.status(404).json({ error: 'Musiqa topilmadi' });
      return;
    }
    const { start, end, reset } = req.body as { start?: unknown; end?: unknown; reset?: unknown };
    const source = track.sourceUrl ?? track.url;
    let result: { url: string; durationSec: number };
    if (reset === true) {
      result = { url: source, durationSec: Math.round(await audioDuration(source)) };
    } else {
      if (typeof start !== 'number' || typeof end !== 'number' || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end - start < MIN_TRIM_SEC) {
        res.status(422).json({ error: `Oraliq noto'g'ri: B kamida ${MIN_TRIM_SEC} soniya A dan keyin bo'lsin` });
        return;
      }
      result = await trimAudio(source, start, end);
    }
    const oldUrl = track.url;
    track.url = result.url;
    track.sourceUrl = source;
    track.durationSec = result.durationSec;
    track.trimStart = reset === true ? undefined : (start as number);
    track.trimEnd = reset === true ? undefined : (end as number);
    await track.save();
    if (oldUrl !== result.url) {
      await replaceMusicUrl(oldUrl, result.url, track.builtInKey);
      if (oldUrl !== source) await deleteTrackFileIfUnused(oldUrl);
    }
    res.json({ id: String(track._id), url: track.url, durationSec: track.durationSec, trimStart: track.trimStart ?? null, trimEnd: track.trimEnd ?? null });
  } catch (err) {
    if (err instanceof TrimError) {
      res.status(422).json({ error: err.message });
      return;
    }
    next(err);
  }
}

/** DELETE /api/admin/music/:id — kutubxonadan olib tashlaydi (fayl ham). Ishlatilayotganini o'chirmaydi. */
export async function adminDeleteTrack(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const track = isValidObjectId(req.params.id) ? await Track.findById(req.params.id) : null;
    if (!track) {
      res.status(404).json({ error: 'Musiqa topilmadi' });
      return;
    }
    if (track.builtInKey) {
      res.status(403).json({ error: "Saytga o'rnatilgan musiqani o'chirib bo'lmaydi — Inactive qiling" });
      return;
    }
    const usedBy = await Invitation.countDocuments({ musicUrl: track.url });
    if (usedBy > 0 || (await templateMedia()).has(track.url)) {
      res.status(409).json({
        error: usedBy > 0
          ? `Bu musiqa ${usedBy} ta taklifnomada chalinmoqda — o'chirish o'rniga Inactive qiling`
          : "Bu musiqa shablon standarti — avval «Shablonlar» bo'limida boshqasini tanlang",
      });
      return;
    }
    await track.deleteOne();
    await deleteTrackFileIfUnused(track.url);
    if (track.sourceUrl && track.sourceUrl !== track.url) await deleteTrackFileIfUnused(track.sourceUrl);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
