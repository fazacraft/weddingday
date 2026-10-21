import { isValidObjectId } from 'mongoose';
import { Invitation, IInvitation } from '../models/Invitation';
import { User } from '../models/User';
import { TEMPLATE_NAMES } from './templateNames';
import { sendApprovalRequest, sendToChat, escapeHtml, publicLink } from './telegram';

/**
 * Egasi taklifnomani nashr qilmoqchi bo'lganda chaqiriladi (saqlashdan oldin).
 * Admin yoki allaqachon tasdiqlangan taklifnoma darhol nashr bo'ladi; aks holda
 * qoralama bo'lib qoladi va admin'ga so'rov ketadi. true — so'rov yuborish kerak.
 */
export function applyPublishRequest(inv: IInvitation, isAdmin: boolean): boolean {
  if (isAdmin) {
    inv.review = 'approved';
    inv.status = 'published';
    return false;
  }
  if (inv.review === 'approved') {
    inv.status = 'published';
    return false;
  }
  inv.status = 'draft';
  const alreadyPending = inv.review === 'pending';
  inv.review = 'pending';
  if (!alreadyPending) inv.reviewRequestedAt = new Date();
  return !alreadyPending;
}

export async function notifyApprovalNeeded(inv: IInvitation, reminder = false): Promise<void> {
  const owner = await User.findById(inv.owner).select('name email');
  await sendApprovalRequest({
    id: String(inv._id),
    slug: inv.slug,
    groomName: inv.groomName,
    brideName: inv.brideName,
    eventTitle: inv.eventTitle,
    date: inv.date,
    time: inv.time,
    venueName: inv.venueName,
    template: TEMPLATE_NAMES[inv.template] ?? inv.template,
    ownerName: owner?.name ?? '—',
    ownerEmail: owner?.email ?? '—',
  }, reminder);
}

/** Admin qarori: tasdiqlash → nashr, rad etish → qoralama. Topilmasa null. */
export async function decideReview(id: string, decision: 'approve' | 'reject'): Promise<IInvitation | null> {
  if (!isValidObjectId(id)) return null;
  const inv = await Invitation.findById(id);
  if (!inv) return null;
  if (decision === 'approve') {
    inv.review = 'approved';
    inv.status = 'published';
  } else {
    inv.review = 'rejected';
    inv.status = 'draft';
  }
  await inv.save();
  // Egasi botga yozgan bo'lsa, natijani unga ham yuboramiz
  if (inv.ownerTgChatId) {
    const names = `${escapeHtml(inv.groomName)} &amp; ${escapeHtml(inv.brideName)}`;
    void sendToChat(
      inv.ownerTgChatId,
      decision === 'approve'
        ? `✅ <b>${names}</b> taklifnomasi tasdiqlandi!\n\nHavolangiz: ${escapeHtml(publicLink(inv.slug))}`
        : `❌ <b>${names}</b> taklifnomasi rad etildi.\nKabinetda ma'lumotlarni tekshirib, qayta yuboring.`
    );
  }
  return inv;
}
