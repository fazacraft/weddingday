import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "";

let socket: Socket | null = null;

/**
 * Socket.io ulanishi faqat jonli taklifnoma ochilganda kerak — shuning uchun
 * dangasa (lazy) yaratiladi. apiUrl bo'sh bo'lsa joriy origin ishlatiladi.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_URL || undefined, {
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
