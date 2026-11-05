import { Schema, model } from 'mongoose';

/** Telegram backup holati — bitta yozuv (kanal admin botga post forward qilganda ulanadi). */
export interface IBackupState {
  _id: string;
  channelId?: number;
  channelTitle?: string;
  lastRunAt?: Date;
  lastOkAt?: Date;
  lastError?: string;
}

const backupStateSchema = new Schema<IBackupState>(
  {
    _id: { type: String, default: 'main' },
    channelId: { type: Number },
    channelTitle: { type: String },
    lastRunAt: { type: Date },
    lastOkAt: { type: Date },
    lastError: { type: String },
  },
  { collection: 'backupstate' }
);

export const BackupState = model<IBackupState>('BackupState', backupStateSchema);

/**
 * Kanalga yuborilgan yuklangan fayl. Fayllar o'zgarmaydi, shuning uchun har biri
 * bir marta yuboriladi. Bu ro'yxat baza nusxasiga kiradi: tiklash skripti fayllarni
 * shu fileId'lar bo'yicha Telegram'dan qaytarib oladi.
 */
export interface IBackupFile {
  filename: string;
  contentType: string;
  size: number;
  fileId: string;
  messageId: number;
  sentAt: Date;
}

const backupFileSchema = new Schema<IBackupFile>(
  {
    filename: { type: String, required: true, unique: true },
    contentType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    fileId: { type: String, required: true },
    messageId: { type: Number, required: true },
    sentAt: { type: Date, default: Date.now },
  },
  { collection: 'backupfiles' }
);

export const BackupFile = model<IBackupFile>('BackupFile', backupFileSchema);
