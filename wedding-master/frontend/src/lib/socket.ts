import { io, type Socket } from "socket.io-client";
import { BASE } from "./base";


let socket: Socket | null = null;

/**
 * Socket.io ulanishi faqat jonli taklifnoma ochilganda kerak — shuning uchun
 * dangasa (lazy) yaratiladi. apiUrl bo'sh bo'lsa joriy origin ishlatiladi.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL || undefined, {
      path: `${BASE}socket.io`,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
