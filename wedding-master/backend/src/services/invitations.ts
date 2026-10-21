import { Invitation, IInvitation } from '../models/Invitation';
import { Wish } from '../models/Wish';
import { Rsvp } from '../models/Rsvp';
import { deleteUploads } from '../storage';

/**
 * Taklifnomani butunlay o'chiradi: tilaklar, javoblar va yuklangan rasm/musiqa
 * ham. Boshqa taklifnoma xuddi shu faylni ishlatayotgan bo'lsa (masalan, seed
 * surati), fayl qoldiriladi.
 */
export async function removeInvitation(inv: IInvitation): Promise<void> {
  const media = [inv.couplePhoto, inv.musicUrl].filter(Boolean);
  await Promise.all([
    Wish.deleteMany({ invitation: inv._id }),
    Rsvp.deleteMany({ invitation: inv._id }),
    inv.deleteOne(),
  ]);
  const stillUsed = await Invitation.find({
    $or: [{ couplePhoto: { $in: media } }, { musicUrl: { $in: media } }],
  }).select('couplePhoto musicUrl');
  const keep = new Set(stillUsed.flatMap((i) => [i.couplePhoto, i.musicUrl]));
  await deleteUploads(media.filter((m) => !keep.has(m)));
}
