import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = process.env.API_TARGET ?? 'http://localhost:5050';

// BASE_PATH=/erbotayev → sayt beluga.uz/erbotayev/ ostida ishlaydi (backend ham shu env'ni o'qiydi)
const BASE_PATH = (process.env.BASE_PATH ?? '').replace(/\/+$/, '');

export default defineConfig({
  base: `${BASE_PATH}/`,
  plugins: [react()],
  server: {
    port: 5173,
    // Frontend va backend bir origin'da ko'rinadi: telefondan (LAN) ochganda
    // ham API, yuklangan fayllar va Socket.io ishlaydi
    proxy: {
      '/api': API_TARGET,
      '/uploads': API_TARGET,
      '/socket.io': { target: API_TARGET, ws: true },
    },
  },
});
