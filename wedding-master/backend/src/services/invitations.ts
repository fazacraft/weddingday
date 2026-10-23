import { Invitation, IInvitation, invitationMedia } from '../models/Invitation';
import { Wish } from '../models/Wish';
import { Rsvp } from '../models/Rsvp';
import { deleteUploads } from '../storage';

/**
 * Taklifnomani butunlay o'chiradi: tilaklar, javoblar va yuklangan rasm/musiqa
 * ham. Boshqa taklifnoma xuddi shu faylni ishlatayotgan bo'lsa (masalan, seed
 * surati), fayl qoldiriladi.
 */
export async function removeInvitation(inv: IInvitation): Promise<void> {
  const media = invitationMedia(inv);
  await Promise.all([
    Wish.deleteMany({ invitation: inv._id }),
    Rsvp.deleteMany({ invitation: inv._id }),
    inv.deleteOne(),
  ]);
  if (media.length === 0) return;
  const stillUsed = await Invitation.find({
    $or: [
      { couplePhoto: { $in: media } },
      { coverPhoto: { $in: media } },
      { venuePhoto: { $in: media } },
      { gallery: { $in: media } },
      { musicUrl: { $in: media } },
    ],
  }).select('couplePhoto coverPhoto venuePhoto gallery musicUrl');
  const keep = new Set(stillUsed.flatMap((i) => invitationMedia(i)));
  await deleteUploads(media.filter((m) => !keep.has(m)));
}
