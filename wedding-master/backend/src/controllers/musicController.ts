import { Request, Response, NextFunction } from 'express';
import { isValidObjectId } from 'mongoose';
import { Invitation } from '../models/Invitation';
import { Track, TRACK_STATUSES, TrackStatus } from '../models/Track';
import { User } from '../models/User';
import { AuthedRequest } from '../middleware/auth';
import { deleteTrackFileIfUnused, syncUploadedMusic } from '../services/musicLibrary';

/** GET /api/music — wizard'dagi ro'yxat uchun tasdiqlangan musiqalar. */
export async function listApprovedMusic(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tracks = await Track.find({ status: 'approved' }).sort({ decidedAt: -1 }).lean();
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.json(
      tracks.map((t) => ({ id: String(t._id), url: t.url, title: t.title, artist: t.artist, durationSec: t.durationSec }))
    );
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/music?status=pending|approved|rejected — nomzodlar va ro'yxat. */
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

/** PATCH /api/admin/music/:id — nom/ijrochini tuzatish va qaror (tasdiqlash, rad etish). */
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
      if (status === 'approved' && !track.title) {
        res.status(422).json({ error: "Ro'yxatga qo'shishdan oldin qo'shiq nomini yozing", field: 'title' });
        return;
      }
      track.status = status as TrackStatus;
      track.decidedAt = new Date();
    }
    await track.save();
    // Rad etilgan va hech kim ishlatmayotgan fayl saqlanib qolmasin
    if (track.status === 'rejected' && (await deleteTrackFileIfUnused(track.url))) {
      await track.deleteOne();
      res.json({ id: String(track._id), deleted: true });
      return;
    }
    res.json({ id: String(track._id), status: track.status, title: track.title, artist: track.artist, durationSec: track.durationSec });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/music/:id — kutubxonadan olib tashlaydi; ishlatilmayotgan bo'lsa fayl ham o'chadi. */
export async function adminDeleteTrack(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const track = isValidObjectId(req.params.id) ? await Track.findById(req.params.id) : null;
    if (!track) {
      res.status(404).json({ error: 'Musiqa topilmadi' });
      return;
    }
    await track.deleteOne();
    await deleteTrackFileIfUnused(track.url);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
