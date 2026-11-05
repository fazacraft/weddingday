import mongoose from 'mongoose';
import { IInvitation } from '../models/Invitation';

/*
 * To'lov cheklari. Rasm va musiqalardan alohida saqlanadi: /uploads ochiq, chekda esa
 * shaxsiy ma'lumot bor — uni faqat admin ko'radi (GET /api/admin/invitations/:id/receipt).
 */
const BUCKET = 'receipts';

function bucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB is not connected');
  return new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET });
}

/** Fayl turi mazmunidan aniqlanadi — brauzer aytgan turga ishonilmaydi. */
export function sniffReceipt(data: Buffer): { contentType: string; ext: string } | null {
  if (data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { contentType: 'image/jpeg', ext: 'jpg' };
  if (data.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return { contentType: 'image/png', ext: 'png' };
  if (data.subarray(0, 4).toString('latin1') === 'RIFF' && data.subarray(8, 12).toString('latin1') === 'WEBP') return { contentType: 'image/webp', ext: 'webp' };
  if (data.subarray(0, 5).toString('latin1') === '%PDF-') return { contentType: 'application/pdf', ext: 'pdf' };
  return null;
}

export async function storeReceipt(filename: string, data: Buffer, contentType: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const stream = bucket().openUploadStream(filename, { metadata: { contentType } });
    stream.once('finish', () => resolve());
    stream.once('error', reject);
    stream.end(data);
  });
}

export function receiptStream(filename: string) {
  return bucket().openDownloadStreamByName(filename);
}

export async function deleteReceiptFile(filename: string | undefined): Promise<void> {
  if (!filename) return;
  const files = await bucket().find({ filename }).toArray();
  await Promise.all(files.map((f) => bucket().delete(f._id)));
}

/** Rad etilganda yoki taklifnoma o'chganda: chek fayli ham ketadi. Saqlash chaqiruvchida. */
export async function clearReceipt(inv: IInvitation): Promise<void> {
  const filename = inv.receipt?.filename;
  inv.receipt = undefined;
  await deleteReceiptFile(filename);
}
