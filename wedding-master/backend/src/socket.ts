import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { isValidObjectId } from 'mongoose';

let io: Server | null = null;

const room = (invitationId: string) => `inv:${invitationId}`;

/** HTTP serverga Socket.io ni ulaydi (server.ts da bir marta chaqiriladi). */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    path: `${(process.env.BASE_PATH ?? '').replace(/\/+$/, '')}/socket.io`,
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    // Har bir mehmon faqat o'zi ochgan taklifnoma xonasiga qo'shiladi —
    // boshqa juftliklarning tilaklari unga bormaydi.
    socket.on('join', (invitationId: unknown) => {
      if (typeof invitationId === 'string' && isValidObjectId(invitationId)) {
        void socket.join(room(invitationId));
      }
    });
  });

  return io;
}

/** Yangi tilak yaratilganda shu taklifnomani ochib turganlarga xabar beradi. */
export function emitWishCreated(invitationId: string, wish: unknown): void {
  io?.to(room(invitationId)).emit('wish:created', wish);
}
