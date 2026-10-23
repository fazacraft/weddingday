import { Invitation, IInvitation, invitationMedia } from '../models/Invitation';
import { Wish } from '../models/Wish';
import { Rsvp } from '../models/Rsvp';
import { Track } from '../models/Track';
import { deleteUploads } from '../storage';
import { libraryMedia } from './musicLibrary';

/**
 * Taklifnomani butunlay o'chiradi: tilaklar, javoblar va yuklangan rasm/musiqa
 * ham. Boshqa taklifnoma xuddi shu faylni ishlatayotgan bo'lsa (masalan, seed
 * surati) yoki musiqa kutubxonasida (kutayotgan/tasdiqlangan) bo'lsa, fayl
 * qoldiriladi.
 */
export async function removeInvitation(inv: IInvitation): Promise<void> {
  const media = invitationMedia(inv);
  await Promise.all([
    Wish.deleteMany({ invitation: inv._id }),
    Rsvp.deleteMany({ invitation: inv._id }),
    inv.deleteOne(),
  ]);
  if (media.length === 0) return;
  const [stillUsed, inLibrary] = await Promise.all([
    Invitation.find({
      $or: [
        { couplePhoto: { $in: media } },
        { coverPhoto: { $in: media } },
        { venuePhoto: { $in: media } },
        { gallery: { $in: media } },
        { musicUrl: { $in: media } },
      ],
    }).select('couplePhoto coverPhoto venuePhoto gallery musicUrl'),
    libraryMedia(media),
  ]);
  const keep = new Set([...stillUsed.flatMap((i) => invitationMedia(i)), ...inLibrary]);
  const removed = media.filter((m) => !keep.has(m));
  await deleteUploads(removed);
  // Rad etilgan nomzodning fayli endi yo'q — yozuvi ham kerak emas
  if (removed.length) await Track.deleteMany({ url: { $in: removed }, status: 'rejected' });
}
