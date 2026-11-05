import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = process.env.API_TARGET ?? 'http://localhost:5050';

// BASE_PATH=/erbotayev → sayt beluga.uz/erbotayev/ ostida ishlaydi (backend ham shu env'ni o'qiydi)
const BASE_PATH = (process.env.BASE_PATH ?? '').replace(/\/+$/, '');

// Ochiq oyna yangi deploy chiqqanini bilishi uchun (lib/buildCheck.ts)
const BUILD_ID = Date.now().toString(36);

export default defineConfig({
  base: `${BASE_PATH}/`,
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  plugins: [
    react(),
    {
      name: 'build-id',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) });
      },
    },
  ],
  build: {
    // dist/.vite/manifest.json — backend taklifnoma sahifasida shablon kodini
    // oldindan (modulepreload) e'lon qilish uchun fayl nomlarini shundan oladi
    manifest: true,
  },
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
